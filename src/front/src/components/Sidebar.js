import React, { useState, useContext, useEffect } from "react";
import {
    Link,
    useHistory,
    useLocation
} from "react-router-dom";
import { ConfigContext } from '../contexts/ConfigContext'

const SidebarItemIconAndLabel = ({ view }) => (
    <>
        <div class="sidebarIcon">
            <i class={`fas fa-${view.icon || "square"}`}></i>
        </div>
        <div class="sidebarLabel">{view.label}</div>
    </>
)

export default ({ logout }) => {
    const location = useLocation();
    const config = useContext(ConfigContext);
    const history = useHistory();
    const [showMenu, setShowMenu] = useState(false);

    const toggleMenu = () => setShowMenu(!showMenu);

    useEffect(() => {
        const closeMenu = (e) => {
            if (!e.target.closest('.menu') && !e.target.closest('.menuButton')) {
                setShowMenu(false);
            }
        };

        document.addEventListener('click', closeMenu);
        return () => document.removeEventListener('click', closeMenu);
    }, []);

    console.log({ showMenu })

    return (
        <div class="sidebar">
            {config.logo ? <img src={config.logo} class="logo" /> : null}
            <div class="sidebarTitle">{config.name}</div>
            <div class="sidebarSubtitle">Back-office</div>
            {config.views.filter(view => !view.hidden).map((view, i) => {
                if (view.type === "link") {
                    return (
                        <a href={view.src} key={i}>
                            <div class="sidebarItem">
                                <div>
                                    <SidebarItemIconAndLabel view={view} />
                                </div>
                            </div>
                        </a>
                    )
                } else if (view.type === "iframe") {
                    const isActive = location.pathname === `/iframe/${i}`
                    return (
                        <Link to={`/iframe/${i}`} key={i}>
                            <div class={`sidebarItem ${isActive ? "active" : ""}`}>
                                <div>
                                    <SidebarItemIconAndLabel view={view} />
                                </div>
                            </div>
                        </Link>
                    )
                } else if (view.type === "custom") {
                    const isActive = location.pathname === `/customView/${i}`
                    return (
                        <Link to={`/customView/${i}`} key={i}>
                            <div class={`sidebarItem ${isActive ? "active" : ""}`}>
                                <div>
                                    <SidebarItemIconAndLabel view={view} />
                                </div>
                            </div>
                        </Link>
                    )
                } else if (view.type === "table") {
                    const isActive =
                        location.pathname === `/records/${i}` ||
                        location.pathname === `/createRecord/${i}` ||
                        location.pathname.startsWith(`/record/${i}/`) ||
                        location.pathname.startsWith(`/editRecord/${i}/`)
                    return (
                        <div onClick={() => history.push(`/records/${i}`)} key={i}>
                            <div class={`sidebarItem ${isActive ? "active" : ""}`}>
                                <div>
                                    <div class="notificationWrapper"></div>
                                    <SidebarItemIconAndLabel view={view} />
                                </div>
                                {view.subviews ? (
                                    <>
                                        <div class="subviewsSeparator"></div>
                                        {view.subviews.map((subview, j) => {
                                            const isActive = location.pathname == `/records/${i}/${j}`
                                            return (
                                                <div onClick={(e) => {
                                                    history.push(`/records/${i}/${j}`);
                                                    e.stopPropagation();
                                                }}>
                                                    <div data-subview-index={j} class={isActive ? "active" : ""}>
                                                        <div class="notificationWrapperForSubview"></div>
                                                        {subview.label}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </>
                                ) : null}
                            </div>
                        </div>
                    )
                }
            })}
            {!config.hideBranding ? (
                <div class="sidebarBranding">Made with <i class="fas fa-heart"></i> by Galadrim</div>
            ) : null}
            <div class="menu" onClick={toggleMenu}>
                <div class="menuButton">
                    <i class="far fa-ellipsis-v"></i>
                </div>
                {showMenu ? (
                    <div class="menuOptions">
                        <div onClick={logout} class="menuOption">
                            <i class="far fa-sign-out"></i> Se déconnecter
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
