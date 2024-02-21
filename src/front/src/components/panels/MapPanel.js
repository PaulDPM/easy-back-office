import { useEffect, useRef } from "react"
import axios from "axios";

export default ({ panel, record, view }) => {
    const mapRef = useRef();

    useEffect(() => {
        if (window.google && record) {
            if (panel.query) {
                axios.get("/customQuery", {
                    query: panel.query,
                    primaryValue: record[view.primaryId]
                }).then((response) => {
                    const result = response?.data?.[0]
                    if (result) {
                        initMap(result.Lat, result.Lng, panel.zoom || 12)
                    }
                })
            } else {
                initMap(record[panel.latitudeField], record[panel.longitudeField], panel.zoom || 12)
            }
        }
    }, [record, window.google])

    const initMap = (lat, lng, zoom) => {
        const map = new window.google.maps.Map(mapRef.current, {
            zoom,
            center: {
                lat,
                lng
            }
        });
        new window.google.maps.Marker({
            position: { lat, lng },
            map
        });
    }

    return (
        <div class='map' ref={mapRef}></div>
    )
}