import { useState } from "react";
import Editor from "ckeditor5-custom-build"
import { CKEditor } from '@ckeditor/ckeditor5-react'

const baseURL = process.env.NODE_ENV === "development" ? 'http://localhost/admin/api' : '/_HOMEPAGE_/api';

export default ({ column, onChange, initialData }) => {
    const [characters, setCharacters] = useState(0);
    const [words, setWords] = useState(0);

    return (
        <>
            <CKEditor
                editor={Editor}
                config={{
                    simpleUpload: {
                        uploadUrl: `${baseURL}/uploadFileFromBetterRichTextInput`,
                        withCredentials: true,
                        headers: {
                            "file-upload-properties": JSON.stringify(column.fileUploadProperties)
                        }
                    },
                    wordCount: {
                        onUpdate: stats => {
                            setCharacters(stats.characters)
                            setWords(stats.words)
                        }
                    }
                }}
                data={initialData?.[column.htmlField]}
                onChange={(event, editor) => {
                    onChange({
                        [column.htmlField]: editor.getData()
                    })
                }}
            />
            <div class="richTextStats">{words} mots, {characters} caractères</div>
        </>

    );
};
