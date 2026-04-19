import "@testing-library/jest-dom";
import { server } from "./msw/server";

window.scrollTo = () => {};

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
