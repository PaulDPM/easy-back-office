import { useContext } from "react"
import {
	Redirect
} from "react-router-dom";
import { ConfigContext } from '../contexts/ConfigContext'

export default () => {
	const config = useContext(ConfigContext)
	const firstView = config.views[0]

	if (!firstView) {
		return null
	}
	if (firstView.type === "table") {
		return <Redirect to="/records/0" />
	}
	if (firstView.type === "iframe") {
		return <Redirect to="/iframe/0" />
	}
	if (firstView.type === "custom") {
		return <Redirect to="/customView/0" />
	}
	return null;
}