import V24CategoryGroup from "./V24CategoryGroup";
import { CATEGORIES } from "./data";

export default function V24Categories() {
  return (
    <div className="v24-section v24-categories" data-v24-section="categories">
      {CATEGORIES.map((c) => (
        <V24CategoryGroup key={c.key} category={c} />
      ))}
    </div>
  );
}
