import { useEffect, useRef } from "react";

export default ({ column, onChange, initialData }) => {
    const googleMapsInput = useRef(null);

    useEffect(() => {
        if (googleMapsInput.current && window.google) {
            const autocomplete = new window.google.maps.places.Autocomplete(
                googleMapsInput.current,
                column.componentRestrictions ? {
                    componentRestrictions: column.componentRestrictions
                } : {}
            )
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place.length === 0) {
                    return;
                }
                if (!place.geometry) {
                    return;
                } else {
                    const fieldValues = {
                        latitudeField: (place) => place.geometry.location.lat(),
                        longitudeField: (place) => place.geometry.location.lng(),
                        addressField: (place) => place.formatted_address,
                        streetNumberField: (place) => place.address_components.find(x => x.type === "street_number")?.long_name,
                        routeField: (place) => place.address_components.find(x => x.type === "route")?.long_name,
                        localityField: (place) => place.address_components.find(x => x.type === "locality")?.long_name,
                        administrativeAreaLevel2Field: (place) => place.address_components.find(x => x.type === "administrative_area_level_2")?.long_name,
                        administrativeAreaLevel1Field: (place) => place.address_components.find(x => x.type === "administrative_area_level_1")?.long_name,
                        countryField: (place) => place.address_components.find(x => x.type === "country")?.long_name,
                        postalCodeField: (place) => place.address_components.find(x => x.type === "postal_code")?.long_name
                    }
                    const placeData = {}
                    for (const key in fieldValues) {
                        if (column[key]) {
                            placeData[column[key]] = fieldValues[key](place)
                        }
                    }
                    googleMapsInput.current.value = place.formatted_address
                    onChange(placeData);
                }
            });
        }
    }, [googleMapsInput.current]);

    useEffect(() => {
        const setInputValue = () => {
            if (googleMapsInput.current) {
                googleMapsInput.current.value = ""
            }
        }
        googleMapsInput?.current?.addEventListener("focusout", setInputValue)
        return () => googleMapsInput?.current?.removeEventListener("focusout", setInputValue)
    }, [googleMapsInput.current])

    return (
        <div>
            <input
                type='text'
                placeholder=''
                ref={googleMapsInput}
                defaultValue={initialData?.[column.name]}
            />
        </div>
    )
}