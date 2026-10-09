export function Msg({ state }) {
  if (!state) return null
  if (state.ok) return state.message ? <p className="msg ok" role="status">{state.message}</p> : null
  return <p className="msg err" role="alert">{state.error}</p>
}
