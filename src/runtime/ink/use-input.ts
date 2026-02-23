import { useMemo } from "react";
import { useInput } from "ink";
import { uniqueStrings } from "../../utils/arrays";

export type KeySpec = string | ReadonlyArray<string>;

export type InkKeyLike = {
	return?: boolean;
	escape?: boolean;
	upArrow?: boolean;
	downArrow?: boolean;
	leftArrow?: boolean;
	rightArrow?: boolean;
	tab?: boolean;
	shift?: boolean;
	ctrl?: boolean;
	meta?: boolean;
	backspace?: boolean;
	delete?: boolean;
	pageDown?: boolean;
	pageUp?: boolean;
	home?: boolean;
	end?: boolean;
};

export type KeyInputEvent = {
	input: string;
	key: InkKeyLike;
	names: ReadonlyArray<string>;
};

export type KeyInputHandler = (event: KeyInputEvent) => void;

export type UseKeyInputOptions = {
	isActive?: boolean;
};

function controlCharToLetter(input: string): string | null {
	if (input.length !== 1) {
		return null;
	}

	const code = input.charCodeAt(0);
	if (code < 1 || code > 26) {
		return null;
	}

	return String.fromCharCode(96 + code);
}

export function normalizeKeySpec(keys: KeySpec): string[] {
	if (typeof keys === "string") {
		return uniqueStrings([keys]);
	}

	return uniqueStrings(keys);
}

export function keyNamesFromInput(input: string, key: InkKeyLike): string[] {
	const names = new Set<string>();
	const ctrlLetter = controlCharToLetter(input);

	if (typeof input === "string" && input.length > 0) {
		names.add(input);
		names.add(input.toLowerCase());

		if (ctrlLetter) {
			names.add(ctrlLetter);
		}

		if (input === " ") {
			names.add("space");
		}

		if (key.shift && /^[A-Za-z]$/.test(input)) {
			names.add(`S-${input.toLowerCase()}`);
		}

		if (key.ctrl && /^[A-Za-z]$/.test(input)) {
			names.add(`C-${input.toLowerCase()}`);
		}
	}

	if (key.ctrl && ctrlLetter) {
		names.add(`C-${ctrlLetter}`);
	}

	if (key.return) {
		names.add("enter");
	}
	if (key.escape) {
		names.add("escape");
	}
	if (key.upArrow) {
		names.add("up");
	}
	if (key.downArrow) {
		names.add("down");
	}
	if (key.leftArrow) {
		names.add("left");
	}
	if (key.rightArrow) {
		names.add("right");
	}
	if (key.tab) {
		names.add(key.shift ? "S-tab" : "tab");
	}
	if (key.pageUp) {
		names.add("pageup");
	}
	if (key.pageDown) {
		names.add("pagedown");
	}
	if (key.home) {
		names.add("home");
	}
	if (key.end) {
		names.add("end");
	}
	if (key.backspace) {
		names.add("backspace");
	}
	if (key.delete) {
		names.add("delete");
	}

	return Array.from(names);
}

export function useKeyInput(
	keys: KeySpec | undefined,
	handler: KeyInputHandler,
	options: UseKeyInputOptions = {},
): void {
	const expected = useMemo(() => {
		if (keys === undefined) {
			return null;
		}

		return new Set(normalizeKeySpec(keys));
	}, [keys]);

	useInput(
		(input, key) => {
			const typedKey = key as InkKeyLike;
			const names = keyNamesFromInput(input, typedKey);

			if (expected) {
				const matched = names.some((name) => expected.has(name));
				if (!matched) {
					return;
				}
			}

			handler({
				input,
				key: typedKey,
				names,
			});
		},
		{
			isActive: options.isActive ?? true,
		},
	);
}
