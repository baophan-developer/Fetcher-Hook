import {useCallback, useEffect, useReducer, useRef} from "react";
import {modifyKey} from "../utils";

type Store = {
	expiry: Date;
	data: any;
};

const store = new Map<string, Store>();

function setData<T>(key: string, data: T, ttl: number = 10) {
	const time = new Date();
	time.setSeconds(time.getSeconds() + ttl);
	store.set(key, {
		expiry: time,
		data,
	});
}

function getData<T>(key: string): T | undefined {
	const data = store.get(key);
	if (!data) return undefined;
	if (new Date().getTime() > data.expiry.getTime()) {
		store.delete(key);
		return undefined;
	}
	return data.data;
}

enum FETCHER_ACTION_KIND {
	UPDATE_LOADING = "UPDATE_LOADING",
	UPDATE_DATA = "UPDATE_DATA",
	UPDATE_ERROR = "UPDATE_ERROR",
}

type FetcherAction<T> =
	| {
			type: FETCHER_ACTION_KIND.UPDATE_DATA;
			payload: T;
	  }
	| {
			type: FETCHER_ACTION_KIND.UPDATE_LOADING;
			payload: boolean;
	  }
	| {
			type: FETCHER_ACTION_KIND.UPDATE_ERROR;
			payload: unknown;
	  };

type FetcherState<T> = {
	loading: boolean;
	data: T;
	error: unknown;
};

function fetcherReducer<T>(
	state: FetcherState<T>,
	action: FetcherAction<T>,
): FetcherState<T> {
	switch (action.type) {
		case FETCHER_ACTION_KIND.UPDATE_DATA:
			return {
				...state,
				data: action.payload,
			};
		case FETCHER_ACTION_KIND.UPDATE_LOADING: {
			return {
				...state,
				loading: action.payload,
			};
		}
		case FETCHER_ACTION_KIND.UPDATE_ERROR: {
			return {
				...state,
				error: action.payload,
			};
		}
		default:
			return {
				...state,
			};
	}
}

type UseFetcherProps<T, R = any> = {
	fetchKey: Array<unknown>;
	fetchFn: (key?: Array<unknown>, params?: unknown) => Promise<T>;
	transform?: (response: R | unknown) => T;
	initial?: boolean;
	initialData?: T;
	enabled?: boolean;
	enableCache?: boolean;
	ttlCache?: number;
};
export default function useFetcher<T = any>(props: UseFetcherProps<T>) {
	const {
		fetchKey,
		fetchFn,
		transform,
		initial = true,
		initialData,
		enabled = true,
		enableCache = true,
		ttlCache = 10,
	} = props;
	const [state, dispatch] = useReducer(fetcherReducer, {
		loading: false,
		data: initialData,
		error: undefined,
	});
	const firstMount = useRef(true);
	const oldKey = useRef(modifyKey(fetchKey));

	const fetcher = useCallback(
		async (params?: unknown, hard: boolean = false) => {
			try {
				dispatch({
					type: FETCHER_ACTION_KIND.UPDATE_LOADING,
					payload: true,
				});
				const keyCached = modifyKey(fetchKey);
				if (enableCache && getData(keyCached) !== undefined && !hard) {
					const data = getData(keyCached);
					dispatch({
						type: FETCHER_ACTION_KIND.UPDATE_DATA,
						payload: data,
					});
					return;
				}
				const response = await fetchFn(fetchKey, params);
				const endResult = transform ? transform(response) : response;
				dispatch({
					type: FETCHER_ACTION_KIND.UPDATE_DATA,
					payload: endResult,
				});
				if (enableCache) {
					setData(keyCached, endResult, ttlCache);
				}
			} catch (error) {
				dispatch({
					type: FETCHER_ACTION_KIND.UPDATE_ERROR,
					payload: error,
				});
			} finally {
				dispatch({
					type: FETCHER_ACTION_KIND.UPDATE_LOADING,
					payload: false,
				});
			}
		},
		[enableCache, fetchFn, fetchKey, transform, ttlCache],
	);

	useEffect(() => {
		if (firstMount.current && enabled && initial) {
			fetcher();
			firstMount.current = false;
		}
		const newKey = modifyKey(fetchKey);
		if (!firstMount.current && oldKey.current !== newKey) {
			fetcher();
		}
	}, [enabled, fetchKey, fetcher, initial]);

	return {
		...state,
		refetch: fetcher,
	};
}
