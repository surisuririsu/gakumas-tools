// import { useContext } from "react";
import Image from "next/image";
// import { useDrag, useDrop } from "react-dnd";
import { PItems } from "gakumas-data";
// import LoadoutContext from "@/contexts/LoadoutContext";
import styles from "./PItem.module.scss";

export default function PItem({ itemId, index, onMouseEnter, onMouseLeave }) {
  // const { selection, setSelection, changeItem } = useContext(LoadoutContext);
  const pItem = PItems.getById(itemId);
  // const isBank = index === -1;
  // const selected =
  //   selection &&
  //   selection.type == "PITEM" &&
  //   selection.fromIndex == index &&
  //   (!isBank || selection.id == itemId);

  // function swapWith(item) {
  //   if (item.type == "PITEM") {
  //     if (!isBank) {
  //       changeItem(index, item.id);
  //     }
  //     if (item.fromIndex[0] != -1) {
  //       changeItem(item.fromIndex, isBank ? 0 : itemId);
  //     }
  //   }
  //   setSelection(null);
  // }

  // const [, dragRef] = useDrag(() => ({
  //   type: "PITEM",
  //   item: { type: "PITEM", id: itemId, fromIndex: index },
  // }));
  // const [, dropRef] = useDrop(() => ({
  //   accept: "PITEM",
  //   drop: swapWith,
  // }));

  // function handleClick() {
  //   if (selection) {
  //     swapWith(selection);
  //   } else {
  //     setSelection({ type: "PITEM", id: itemId, fromIndex: index });
  //   }
  // }

  // return (
  //   <div ref={dropRef}>
  //     <div
  //       className={`
  //         ${styles.item}
  //         ${selected ? styles.selected : ""}
  //       `}
  //       ref={dragRef}
  //       onClick={handleClick}
  //     >
  //       {pItem?.icon && (
  //         <Image
  //           src={pItem.icon}
  //           fill
  //           alt={pItem.name}
  //           onMouseEnter={onMouseEnter}
  //           onMouseLeave={onMouseLeave}
  //           sizes="3.75em"
  //         />
  //       )}
  //     </div>
  //   </div>
  // );
  return (
    <div className={styles.item}>
      {pItem?.icon && (
        <Image
          src={pItem.icon}
          fill
          alt={pItem.name}
          // onMouseEnter={onMouseEnter}
          // onMouseLeave={onMouseLeave}
          sizes="3.75em"
        />
      )}
    </div>
  );
}
