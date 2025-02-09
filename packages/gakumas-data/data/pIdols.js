import PIdols from "../lite/pIdols";
import ICONS from "../images/pIdols/imports";

PIdols.getAll().forEach((pIdol) => {
  pIdol.getIcon = () => ICONS[pIdol.id];
});

export default PIdols;
