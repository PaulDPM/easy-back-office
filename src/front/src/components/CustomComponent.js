import React, { useMemo, Suspense } from 'react';
import axios from "axios";
import styled from 'styled-components'

const packages = {
    "react": () => ({ exports: React }),
    "axios": () => ({ exports: axios }),
    "styled-components": () => ({ exports: styled }),
}

function getParsedModule(code, moduleName, packages) {
    const _this = Object.create(packages);
    function require(name) {
        if (!(name in _this) && moduleName === name) {
            let module = { exports: {} };
            _this[name] = () => module;
            let wrapper = Function("require, exports, module", code);
            wrapper(require, module.exports, module);
        } else if (!(name in _this)) {
            throw `Module '${name}' not found`
        }
        return (_this[name]()).exports;
    }

    return require(moduleName);
}


async function fetchComponent(componentPath) {
    try {
        const response = await axios.get(`/customComponent`, {
            params: {
                componentPath
            }
        })
        const text = response.data
        return { default: getParsedModule(text, "__moduleName__", packages) };
    } catch (error) {
        console.error(error)
        return { default() { return <div>Erreur de rendu</div> } }
    }

}

const CustomComponent = ({ componentPath, children, ...props }) => {
    const Component = useMemo(() => {
        return React.lazy(async () => fetchComponent(componentPath))
    }, [componentPath]);

    return (
        <Suspense fallback={null}>
            <Component {...props}>{children}</Component>
        </Suspense>
    )
};

export default React.memo(CustomComponent);
