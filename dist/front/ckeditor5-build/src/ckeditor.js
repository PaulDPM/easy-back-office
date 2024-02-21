"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ckeditor5_editor_classic_1 = require("@ckeditor/ckeditor5-editor-classic");
const ckeditor5_alignment_1 = require("@ckeditor/ckeditor5-alignment");
const ckeditor5_autoformat_1 = require("@ckeditor/ckeditor5-autoformat");
const ckeditor5_basic_styles_1 = require("@ckeditor/ckeditor5-basic-styles");
const ckeditor5_block_quote_1 = require("@ckeditor/ckeditor5-block-quote");
const ckeditor5_cloud_services_1 = require("@ckeditor/ckeditor5-cloud-services");
const ckeditor5_essentials_1 = require("@ckeditor/ckeditor5-essentials");
const ckeditor5_find_and_replace_1 = require("@ckeditor/ckeditor5-find-and-replace");
const ckeditor5_font_1 = require("@ckeditor/ckeditor5-font");
const ckeditor5_heading_1 = require("@ckeditor/ckeditor5-heading");
const ckeditor5_highlight_1 = require("@ckeditor/ckeditor5-highlight");
const ckeditor5_horizontal_line_1 = require("@ckeditor/ckeditor5-horizontal-line");
const ckeditor5_html_embed_1 = require("@ckeditor/ckeditor5-html-embed");
const ckeditor5_image_1 = require("@ckeditor/ckeditor5-image");
const ckeditor5_indent_1 = require("@ckeditor/ckeditor5-indent");
const ckeditor5_link_1 = require("@ckeditor/ckeditor5-link");
const ckeditor5_list_1 = require("@ckeditor/ckeditor5-list");
const ckeditor5_media_embed_1 = require("@ckeditor/ckeditor5-media-embed");
const ckeditor5_paragraph_1 = require("@ckeditor/ckeditor5-paragraph");
const ckeditor5_paste_from_office_1 = require("@ckeditor/ckeditor5-paste-from-office");
const ckeditor5_remove_format_1 = require("@ckeditor/ckeditor5-remove-format");
const ckeditor5_select_all_1 = require("@ckeditor/ckeditor5-select-all");
const ckeditor5_source_editing_1 = require("@ckeditor/ckeditor5-source-editing");
const ckeditor5_table_1 = require("@ckeditor/ckeditor5-table");
const ckeditor5_typing_1 = require("@ckeditor/ckeditor5-typing");
const ckeditor5_upload_1 = require("@ckeditor/ckeditor5-upload");
const ckeditor5_word_count_1 = require("@ckeditor/ckeditor5-word-count");
class Editor extends ckeditor5_editor_classic_1.ClassicEditor {
}
Editor.builtinPlugins = [
    ckeditor5_alignment_1.Alignment,
    ckeditor5_image_1.AutoImage,
    ckeditor5_link_1.AutoLink,
    ckeditor5_autoformat_1.Autoformat,
    ckeditor5_block_quote_1.BlockQuote,
    ckeditor5_basic_styles_1.Bold,
    ckeditor5_cloud_services_1.CloudServices,
    ckeditor5_essentials_1.Essentials,
    ckeditor5_find_and_replace_1.FindAndReplace,
    ckeditor5_font_1.FontBackgroundColor,
    ckeditor5_font_1.FontColor,
    ckeditor5_heading_1.Heading,
    ckeditor5_highlight_1.Highlight,
    ckeditor5_horizontal_line_1.HorizontalLine,
    ckeditor5_html_embed_1.HtmlEmbed,
    ckeditor5_image_1.Image,
    ckeditor5_image_1.ImageCaption,
    ckeditor5_image_1.ImageInsert,
    ckeditor5_image_1.ImageResize,
    ckeditor5_image_1.ImageStyle,
    ckeditor5_image_1.ImageToolbar,
    ckeditor5_image_1.ImageUpload,
    ckeditor5_indent_1.Indent,
    ckeditor5_indent_1.IndentBlock,
    ckeditor5_basic_styles_1.Italic,
    ckeditor5_link_1.Link,
    ckeditor5_link_1.LinkImage,
    ckeditor5_list_1.List,
    ckeditor5_media_embed_1.MediaEmbed,
    ckeditor5_paragraph_1.Paragraph,
    ckeditor5_paste_from_office_1.PasteFromOffice,
    ckeditor5_remove_format_1.RemoveFormat,
    ckeditor5_select_all_1.SelectAll,
    ckeditor5_upload_1.SimpleUploadAdapter,
    ckeditor5_source_editing_1.SourceEditing,
    ckeditor5_basic_styles_1.Strikethrough,
    ckeditor5_table_1.Table,
    ckeditor5_table_1.TableToolbar,
    ckeditor5_typing_1.TextTransformation,
    ckeditor5_basic_styles_1.Underline,
    ckeditor5_word_count_1.WordCount
];
Editor.defaultConfig = {
    toolbar: {
        items: [
            'heading',
            '|',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'link',
            'bulletedList',
            'numberedList',
            'removeFormat',
            '|',
            'outdent',
            'indent',
            '|',
            'imageUpload',
            'imageInsert',
            'blockQuote',
            'insertTable',
            'mediaEmbed',
            'undo',
            'redo',
            'alignment',
            'fontColor',
            'fontBackgroundColor',
            'horizontalLine',
            'highlight',
            'selectAll',
            'findAndReplace',
            'htmlEmbed',
            'sourceEditing'
        ]
    },
    language: 'fr',
    image: {
        toolbar: [
            'imageTextAlternative',
            'toggleImageCaption',
            'imageStyle:inline',
            'imageStyle:block',
            'imageStyle:side',
            'linkImage'
        ]
    },
    table: {
        contentToolbar: [
            'tableColumn',
            'tableRow',
            'mergeTableCells'
        ]
    }
};
exports.default = Editor;
//# sourceMappingURL=ckeditor.js.map