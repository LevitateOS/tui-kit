import { toNonNegativeInt } from "../internal/numbers";
import { normalizeKeySpec, type KeySpec } from "./events";

export type Cleanup = () => void;

export type DestroyLike = {
  destroy?: () => void;
  detach?: () => void;
};

export type RenderLike = {
  render?: () => void;
};

type CleanupEntry = {
  active: boolean;
  cleanup: Cleanup;
};

type EventNodeLike = {
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

type KeyNodeLike = {
  key?: (keys: string | string[], handler: (...args: unknown[]) => void) => void;
  unkey?: (keys: string | string[], handler: (...args: unknown[]) => void) => void;
};

function safeInvoke(callback: Cleanup): void {
  try {
    callback();
  } catch {
    // Cleanup is best effort and must not block remaining disposals.
  }
}

export function safeDestroy(node: DestroyLike | null | undefined): void {
  if (!node) {
    return;
  }

  try {
    if (typeof node.destroy === "function") {
      node.destroy();
      return;
    }

    if (typeof node.detach === "function") {
      node.detach();
    }
  } catch {
    // Best effort cleanup only.
  }
}

export function safeRender(node: RenderLike | null | undefined): void {
  if (!node || typeof node.render !== "function") {
    return;
  }

  try {
    node.render();
  } catch {
    // Best effort render only.
  }
}

export function runCleanups(cleanups: ReadonlyArray<Cleanup>): void {
  for (const cleanup of cleanups) {
    safeInvoke(cleanup);
  }
}

export class LifecycleScope {
  readonly name?: string;
  readonly signal: AbortSignal;

  private readonly abortController = new AbortController();
  private entries: CleanupEntry[] = [];
  private readonly tasks = new Map<string, AbortController>();
  private disposed = false;

  constructor(name?: string) {
    this.name = name;
    this.signal = this.abortController.signal;
  }

  get isDisposed(): boolean {
    return this.disposed;
  }

  onDispose(cleanup: Cleanup): Cleanup {
    if (this.disposed) {
      safeInvoke(cleanup);
      return () => {
        // No-op after scope disposal.
      };
    }

    const entry: CleanupEntry = {
      active: true,
      cleanup,
    };
    this.entries.push(entry);

    return () => {
      if (!entry.active) {
        return;
      }
      entry.active = false;
    };
  }

  bindEvent(node: EventNodeLike, event: string, handler: (...args: unknown[]) => void): Cleanup {
    node.on(event, handler);

    return this.onDispose(() => {
      if (typeof node.off === "function") {
        node.off(event, handler);
        return;
      }

      if (typeof node.removeListener === "function") {
        node.removeListener(event, handler);
      }
    });
  }

  bindKey(node: KeyNodeLike, keys: KeySpec, handler: (...args: unknown[]) => void): Cleanup {
    if (typeof node.key !== "function") {
      return () => {
        // No key binding available for this node.
      };
    }

    const normalized = normalizeKeySpec(keys);
    if (!normalized) {
      return () => {
        // No valid key bindings were provided.
      };
    }

    node.key(normalized, handler);
    return this.onDispose(() => {
      if (typeof node.unkey === "function") {
        node.unkey(normalized, handler);
      }
    });
  }

  timeout(ms: number, callback: () => void): Cleanup {
    const delay = toNonNegativeInt(ms, 0);
    const handle = setTimeout(() => {
      if (this.disposed) {
        return;
      }
      callback();
    }, delay);

    return this.onDispose(() => {
      clearTimeout(handle);
    });
  }

  interval(ms: number, callback: () => void): Cleanup {
    const delay = Math.max(1, toNonNegativeInt(ms, 1));
    const handle = setInterval(() => {
      if (this.disposed) {
        return;
      }
      callback();
    }, delay);

    return this.onDispose(() => {
      clearInterval(handle);
    });
  }

  safeDestroy(node: DestroyLike | null | undefined): void {
    safeDestroy(node);
  }

  safeRender(node: RenderLike | null | undefined): void {
    safeRender(node);
  }

  child(name?: string): LifecycleScope {
    const child = new LifecycleScope(name ?? this.name);
    this.onDispose(() => {
      child.dispose();
    });
    return child;
  }

  runTask<T>(key: string, task: (signal: AbortSignal) => Promise<T> | T): Promise<T | undefined> {
    const normalizedKey = key.trim();
    if (normalizedKey.length === 0 || this.disposed) {
      return Promise.resolve(undefined);
    }

    this.cancelTask(normalizedKey);
    const controller = new AbortController();
    this.tasks.set(normalizedKey, controller);

    const onParentAbort = () => {
      controller.abort();
    };
    this.signal.addEventListener("abort", onParentAbort, { once: true });

    const clearTask = () => {
      this.signal.removeEventListener("abort", onParentAbort);
      if (this.tasks.get(normalizedKey) === controller) {
        this.tasks.delete(normalizedKey);
      }
    };

    return Promise.resolve()
      .then(() => {
        if (controller.signal.aborted || this.disposed) {
          return undefined;
        }
        return task(controller.signal);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return undefined;
        }

        const message = error instanceof Error ? error.message : String(error);
        if (message.toLowerCase().includes("abort")) {
          return undefined;
        }
        throw error;
      })
      .finally(() => {
        clearTask();
      });
  }

  cancelTask(key: string): boolean {
    const normalizedKey = key.trim();
    if (normalizedKey.length === 0) {
      return false;
    }

    const controller = this.tasks.get(normalizedKey);
    if (!controller) {
      return false;
    }

    this.tasks.delete(normalizedKey);
    controller.abort();
    return true;
  }

  cancelAllTasks(): void {
    const controllers = Array.from(this.tasks.values());
    this.tasks.clear();
    for (const controller of controllers) {
      controller.abort();
    }
  }

  linkAbort(signal: AbortSignal): Cleanup {
    if (signal.aborted) {
      this.dispose();
      return () => {
        // No-op for already-aborted signals.
      };
    }

    const onAbort = () => {
      this.dispose();
    };
    signal.addEventListener("abort", onAbort, { once: true });

    return this.onDispose(() => {
      signal.removeEventListener("abort", onAbort);
    });
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.disposed = true;
    this.cancelAllTasks();
    this.abortController.abort();

    const pending = this.entries.slice().reverse();
    this.entries = [];

    for (const entry of pending) {
      if (!entry.active) {
        continue;
      }
      safeInvoke(entry.cleanup);
      entry.active = false;
    }
  }
}

export function createLifecycleScope(name?: string): LifecycleScope {
  return new LifecycleScope(name);
}

export async function withLifecycleScope<T>(
  run: (scope: LifecycleScope) => Promise<T> | T,
  name?: string,
): Promise<T> {
  const scope = createLifecycleScope(name);
  try {
    return await run(scope);
  } finally {
    scope.dispose();
  }
}
