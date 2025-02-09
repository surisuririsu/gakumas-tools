import PItems from "../lite/pItems";
import ICONS from "../images/pItems/icons/imports";
import DETAILS from "../images/pItems/details/imports";

PItems.getAll().forEach((pItem) => {
  pItem.getIcon = () => ICONS[pItem.id];
  pItem.details = DETAILS[pItem.id];
});

export default PItems;
