import { useEffect, useRef } from "react"

function useOutsideClickHandler(ref, handler) {
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                ref.current && 
                !ref.current.contains(event.target) && 
                !document.getElementById("datepickers-container")?.contains(event.target)
            ) {
                handler()
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref]);
}

export default function OutsideClickHandler(props) {
    const wrapperRef = useRef(null);
    useOutsideClickHandler(wrapperRef, props.onOutsideClick);

    return <div ref={wrapperRef}>{props.children}</div>;
}