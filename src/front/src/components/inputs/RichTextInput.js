import { useEffect, useRef } from "react";

window.Quill.prototype.getHTML = function () {
    return this.container.querySelector('.ql-editor').innerHTML;
};

export default ({ column, onChange, initialData }) => {
    const quillContainer = useRef(null);

    useEffect(() => {
        if (quillContainer.current && !quillContainer.current.editor) {
            const editor = new window.Quill(quillContainer.current, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{
                            'header': [1, 2, 3, 4, false]
                        }],
                        ['bold', 'italic', 'underline', 'link'],
                        ['image'],
                        [{
                            'align': []
                        }],
                        [{
                            'list': 'ordered'
                        }, {
                            'list': 'bullet'
                        }],
                        ['clean']
                    ]
                }
            });
            if (column.contentField) {
                if (initialData?.[column.contentField]) {
                    try {
                        editor.setContents(JSON.parse(initialData?.[column.contentField]))
                    } catch (e) { }
                }
            } else if (column.htmlField) {
                editor.clipboard.dangerouslyPasteHTML(0, initialData?.[column.htmlField])
            }
            editor.on('text-change', () => {
                onChange({
                    [column.htmlField]: editor.getHTML(),
                    ...(column.contentField && { [column.contentField]: JSON.stringify(editor.getContents()) })
                })
            });
            quillContainer.current.editor = editor
            return editor.off();
        }
    }, [quillContainer.current])

    return (
        <div class='quillContainer'>
            <div class="quill" ref={quillContainer} style={column.height ? { height: column.height } : null} />
        </div>
    );
};
