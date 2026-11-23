/** @jsxImportSource hono/jsx */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- stands in for a library's wide prop types
type Any = any;

// The two primitives the site takes from base-ui: an ordinary button and an ordinary input.
export const Button = ({ nativeButton: _n, render: _r, focusableWhenDisabled: _f, type = "button", ...props }: Any) => <button type={type} {...props} />;
export const Input = (props: Any) => <input {...props} />;
