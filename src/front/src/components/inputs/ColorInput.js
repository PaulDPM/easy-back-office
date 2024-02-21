import { useEffect, useRef } from "react";

export default ({ column, onChange, initialData }) => {
    const colorPicker = useRef(null);

    useEffect(() => {
        if (colorPicker.current) {
            window.$(colorPicker.current).spectrum({
                preferredFormat: "hex",
                showInput: true,
                chooseText: "OK",
                cancelText: "Annuler",
                color: initialData?.[column.name]
            });
            window.$(colorPicker.current).on("change.spectrum", (_, value) => {
                onChange({ [column.name]: value.toHexString() })
            })
        }
        return () => window.$(colorPicker.current).off()
    }, [colorPicker.current])

    return (
        <input
            ref={colorPicker}
            type='text'
            onChange={(e) => onChange({ [column.name]: e.target.value })}
        />
    );
}