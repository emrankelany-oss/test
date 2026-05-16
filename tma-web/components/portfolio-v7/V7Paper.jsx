// Background layer for V7. Cream paper color + subtle grain + ruled lines.
// Sits behind everything as a fixed (or sticky) layer so it persists.
export default function V7Paper() {
  return (
    <div className="v7-paper" aria-hidden="true">
      <div className="v7-paper-grain" />
      <div className="v7-paper-rules" />
    </div>
  );
}
