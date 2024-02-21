import { useState, useEffect } from "react"
import axios from "axios";
import {
    useParams
} from "react-router-dom";

export default ({ panel, record, view, index }) => {
    const [messages, setMessages] = useState(null);
	const [message, setMessage] = useState("");
    const { viewIndex } = useParams();

    useEffect(() => {
        refreshData()
    }, [record])

    const refreshData = () => {
        axios.get("/customQuery", {
            params: {
                viewIndex,
                panelIndex: index,
                query: panel.getMessagesQuery,
                primaryValue: record[view.primaryId]
            }
        }).then((response) => {
            setMessages(response.data)
        })
    }

	const sendMessage = () => {
		axios.post(panel.postMessageUrl, {
			form: {
				message,
				recipientId: record[view.primaryId],
				secretKey: panel.secretKey
			}
		}).then((response) => {
			refreshData();
		})
		setMessage("")
	}

    return (
        <div>
			{messages?.length > 0 ? (
				<div class="messagesContainer">
					{messages.map((message, index) => (
						<div key={index} class={`message ${message[panel.isAdminField] ? 'adminMessage' : 'userMessage'}`}>
							{message[panel.messageField]}
							<div class="messageDate">{window.moment(message[panel.datetimeField]).format("DD MMM [à] hh:mm")}</div>
						</div>
					))}
				</div>
			) : (
				<div class={`noData panelTable`}>Aucun message</div>
			)}
			<div class="sendMessageContainer">
				<textarea class="sendMessageInput" type="text" value={message} onChange={(event) => setMessage(event.target.value)} />
				<div class="sendButton" onClick={sendMessage}><i class="fa fa-send"></i></div>
			</div>
        </div>
    )
}
