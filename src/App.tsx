import styled from "styled-components";
import "./App.css";
import {PropsWithChildren, useReducer} from "react";
import {JsonView, allExpanded, defaultStyles} from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import useFetcher from "./hooks/useFetcher";
import instance from "./configs";

const COLOR = {
	BLUE: "#1E3A8A",
	GREEN: "#14B8A6",
	ORANGE: "#F97316",
	BLACK: "#111827",
	WHITE: "#F3F4F6",
	GRAY: "#eee",
};

const Container = styled.div`
	width: 100vw;
	height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	background-color: ${COLOR.WHITE};
	gap: 50px;
`;

const BoxShowData = styled.div`
	width: 70vw;
	height: 500px;
	overflow: auto;
	background-color: ${COLOR.GRAY};
	padding: 24px;
	position: relative;
`;

const Space = styled.div`
	width: fit-content;
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	justify-content: space-between;
	align-items: center;
`;

const Button = styled.button`
	width: fit-content;
	padding: 14px 24px;
	font-size: 16px;
	font-weight: 500;
	outline: none;
	border: none;
	border-radius: 16px;
	background-color: ${COLOR.BLUE};
	color: ${COLOR.WHITE};
	cursor: pointer;
	position: relative;
	transition: transform 0.2s ease-in-out;

	&:hover {
		transform: translateY(-3px);
	}
`;

enum APP_ACTION {
	UPDATE_PAGE = "UPDATE_PAGE",
	UPDATE_LIMIT = "UPDATE_LIMIT",
}

type AppState = {
	page: number;
	limit: number;
};

const defaultState = {
	page: 1,
	limit: 10,
};

type AppAction = {
	type: APP_ACTION.UPDATE_PAGE | APP_ACTION.UPDATE_LIMIT;
	payload: number;
};

function appReducer(state: AppState, action: AppAction): AppState {
	const {type, payload} = action;
	switch (type) {
		case APP_ACTION.UPDATE_PAGE:
			return {
				...state,
				page: state.page + payload,
			};
		case APP_ACTION.UPDATE_LIMIT:
			return {
				...state,
				limit: state.limit + payload,
			};
		default:
			return {
				...state,
			};
	}
}

const LoadingContainer = styled.div`
	width: 100%;
	height: 100%;
	position: relative;
`;

const LoadingCircle = styled.div`
	@keyframes top-circle {
		from {
			transform: rotate(-25deg);
		}
		to {
			transform: rotate(335deg);
		}
	}

	@keyframes bottom-circle {
		from {
			transform: rotate(-15deg);
		}
		to {
			transform: rotate(345deg);
		}
	}

	background-color: rebeccapurple;
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);

	& > span {
		display: inline-block;
		position: absolute;
		border-radius: 100%;
		padding: 16px;
		border: 8px solid transparent;

		&.top {
			border-top: 8px solid ${COLOR.WHITE};
			animation: top-circle 1s ease-in-out infinite;
			animation-delay: 0.5s;
		}
		&.bottom {
			border-top: 8px solid ${COLOR.BLUE};
			animation: bottom-circle 1s ease-in-out infinite;
		}
	}
`;

type LoadingProps = {
	isLoading: boolean;
};
function Loading(props: PropsWithChildren<LoadingProps>) {
	const {isLoading, children} = props;
	return (
		<LoadingContainer>
			{isLoading ? (
				<LoadingCircle>
					<span className='top'></span>
					<span className='bottom'></span>
				</LoadingCircle>
			) : (
				children
			)}
		</LoadingContainer>
	);
}

function App() {
	const [state, dispatch] = useReducer(appReducer, defaultState);
	const {data, loading} = useFetcher<any>({
		fetchKey: ["posts", {_limit: state.limit, _page: state.page}],
		fetchFn: async (key) => {
			const params = key[1];
			return instance.get("/posts", {params});
		},
		transform(response) {
			return response?.data;
		},
	});

	return (
		<Container>
			<BoxShowData>
				<Loading isLoading={loading}>
					<JsonView
						data={loading ? [] : (data as any)}
						shouldExpandNode={allExpanded}
						style={defaultStyles}
					/>
				</Loading>
			</BoxShowData>
			<Space>
				<Button
					disabled={loading}
					onClick={() => {
						if (state.page > 1) {
							dispatch({
								type: APP_ACTION.UPDATE_PAGE,
								payload: -1,
							});
						}
					}}
				>
					Previous Data
				</Button>
				<Button
					disabled={loading}
					onClick={() => {
						dispatch({
							type: APP_ACTION.UPDATE_PAGE,
							payload: 1,
						});
					}}
				>
					Next Data
				</Button>
				<Button
					disabled={loading}
					onClick={() => {
						dispatch({
							type: APP_ACTION.UPDATE_LIMIT,
							payload: 10,
						});
					}}
				>
					Add 10 items
				</Button>
				<Button
					disabled={loading}
					onClick={() => {
						if (state.limit > 10) {
							dispatch({
								type: APP_ACTION.UPDATE_LIMIT,
								payload: -10,
							});
						}
					}}
				>
					Remove 10 items
				</Button>
			</Space>
		</Container>
	);
}

export default App;
