import Idols from "../lite/idols";
import ICONS from "../images/idols/imports";

Idols.getAll().forEach((idol) => {
  idol.getIcon = () => ICONS[idol.id];
});

export default Idols;
