import { useState } from "react";

export default ({ text }) => {
    const [visible, setVisible] = useState(false);
    return (
        <div class="labelTooltipContainer" onMouseLeave={() => setVisible(false)}>
            <div class="labelTooltipIcon" onMouseEnter={() => setVisible(true)}>
                <i class='fa fa-question-circle' />
            </div>
            {visible ? (
                <div class='tooltip'>
                    {text}
                </div>
            ) : null}
        </div>
    )
}