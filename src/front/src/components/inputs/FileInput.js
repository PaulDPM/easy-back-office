import { useRef, useState } from "react";
import axios from "axios";
import {
    useParams
} from "react-router-dom";


export default ({ column, onChange, initialData }) => {
    const form = useRef(null);
    const { viewIndex } = useParams();
    const [isLoading, setIsLoading] = useState(false)
    const [path, setPath] = useState(initialData?.[column.name])

    const onInputChange = async () => {
        const f = new FormData(form.current);
        setIsLoading(true);

        const response = await axios({
            method: "post",
            url: `/uploadFile`,
            data: f,
            params: {
                viewIndex,
                columnId: column.__id__
            },
            headers: { "Content-Type": "multipart/form-data" }
        })
        const fileData = {
            [column.name]: response.data.path
        }
        if (column.aspectRatioField) {
            fileData[column.aspectRatioField] = response.data.aspectRatio
        }
        if (column.originalNameField) {
            fileData[column.originalNameField] = response.data.originalFilename
        }
        onChange(fileData)
        setIsLoading(false)
        setPath(response.data.path)
        // var showAsPicture = $(this).data("showAsPicture") === 1
        //var baseUrl = $(".fileInputContent[data-input-id='" + inputId + "']").data("baseUrl")
        //$(".fileInputContent[data-input-id='" + inputId + "']").removeClass("clickToSelectFile").html(showAsPicture ? "<div><img src='https://res.cloudinary.com/forest2/image/fetch/w_600,h_300,c_fit/" + baseUrl + data.path + "' /><div class='deleteFile'><i class='fal fa-trash-alt'></i></div></div>" : "<div class='nonImageFileOutput'><span>Fichier téléchargé</span><div class='deleteFile'><i class='fal fa-trash-alt'></i></div></div>"
    }

    const deleteFile = (e) => {
        setPath(null);
        const fileData = {
            [column.name]: null
        }
        if (column.aspectRatioField) {
            fileData[column.aspectRatioField] = null
        }
        if (column.originalNameField) {
            fileData[column.originalNameField] = null
        }
        onChange(fileData)
        e.preventDefault()
    }

    var id = Math.random().toString()
    return (
        <div class='fileInputContainer'>
            <label htmlFor={id}>
                <form ref={form}>
                    <input type='file' id={id} style={{ display: "none" }} name='file' onChange={onInputChange} />
                </form>
                <div class={`fileInputContent ${!path ? "clickToSelectFile" : ""}`}>
                    {isLoading ?
                        <i class='fa fa-circle-notch fa-spin'></i>
                        : null
                    }
                    {!isLoading && !path ?
                        <div>Cliquez pour sélectionner un fichier</div>
                        : null}
                    {!isLoading && path ? (
                        <div class='nonImageFileOutput'>
                            <span>Fichier téléchargé</span>
                            <div class='deleteFile' onClick={deleteFile}><i class='fal fa-trash-alt'></i></div>
                        </div>
                    ) : null}
                </div>
            </label>
        </div>
    )
}
