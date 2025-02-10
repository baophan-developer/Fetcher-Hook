export function modifyKey(key: Array<unknown>) {
	return key.map((k) => JSON.stringify(k)).join("-");
}
