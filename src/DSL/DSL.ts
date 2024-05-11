class DSL {
    public static parser(jsx: string): string {
        let children = DSL.Children(jsx);
        while(children) {
            jsx = children;
            children = DSL.Children(children);
        }
        return jsx;
    }

    private static Children(jsx: string): string|undefined {
        const params = DSL.extractParameters(jsx, 'Children');
        if(!params) return undefined;
        const includes = DSL.extractParameter(params, 'includes') || '[]';
        const excludes = DSL.extractParameter(params, 'excludes') || '[]';
        const includesJsx = (includes !== '[]') ? `.filter(c => c.name && ${includes}.includes(c.name))` : '';
        const excludesJsx = (excludes !== '[]') ? `.filter(c => c.name && !${excludes}.includes(c.name))` : '';
        const dsl = `<div className={'children'}>
                {data.children
                    ${includesJsx}
                    ${excludesJsx}
                    .map(c => <DefaultNode key={c.id} data={c} />)
                }
        </div>`;
        return DSL.replace(jsx, 'Children', dsl);
    }


    private static extractParameters(jsx: string, component: string): string|undefined {
        const regex = new RegExp(`<${component}(.*?)\\/>`);
        const match = jsx.match(regex);
        if (match && match[1]) return match[1];
        else return undefined;
    }

    private static extractParameter(params: string, name: string): string|undefined {
        const regex = new RegExp(`${name}={(.*?)}`);
        const match = params.match(regex);
        if (match && match[1]) return match[1];
        else return undefined;
    }

    private static replace(jsx: string, component: string, dsl: string): string {
        const regex = new RegExp(`<${component}(.*?)\\/>`);
        return jsx.replace(regex, dsl);
    }

}

export default DSL;
