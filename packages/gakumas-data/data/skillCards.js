import SkillCards from "../lite/skillCards";
import ICONS from "../images/skillCards/icons/imports";
import DETAILS from "../images/skillCards/details/imports";

SkillCards.getAll().forEach((skillCard) => {
  skillCard.getIcon = (idolId = 1) =>
    ICONS[`${skillCard.id}_${idolId}`] || ICONS[skillCard.id];
  skillCard.details = DETAILS[skillCard.id];
});

export default SkillCards;
