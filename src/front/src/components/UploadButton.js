
import { useState, useRef } from "react"
import axios from "axios";

export default ({ view, viewIndex, refreshData }) => {
  const [isUploading, setIsUploading] = useState(false)

  const uploadFileInputRef = useRef(null)

  const selectUploadFile = () => {
    uploadFileInputRef.current?.click()
  }

  const uploadRecords = (evt) => {
    setIsUploading(true)

    const formData = new FormData();
    formData.append("viewIndex", viewIndex)
    formData.append("data", evt.currentTarget.files[0])
    axios.post("/recordsImport", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(() => {
      refreshData()
      window.swal({
        title: "Succès",
        text: "Les données ont été importées avec succès"
      })
    }).catch((error) => {
      window.swal({
        title: "Erreur",
        text: axios.isAxiosError(error) ? error.response.data.message : "Une erreur est survenue",
        dangerMode: true
      })
    }).finally(() => {
      uploadFileInputRef.current.value = ""
      setIsUploading(false)
    })
  }

  return (
    <div class="uploadButton" onClick={selectUploadFile}>
      <i class={`fa ${!isUploading ? "fa-cloud-upload" : "fa-spin fa-circle-notch"}`}></i>
      <input
        ref={uploadFileInputRef}
        id="upload-file"
        type="file"
        accept={view.importFileTypes?.join(",") ?? undefined}
        hidden
        onChange={uploadRecords}
      />
    </div>
  )
}