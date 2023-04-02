
export class TagNames{
    static FOREIGNOBJECT: "FOREIGNOBJECT" = "FOREIGNOBJECT";
}
export class CSSRuleSorted{
    public all: CSSStyleRule[];

    constructor(styleNode: HTMLStyleElement) {
        const oldParent = styleNode.parentElement;
        if (!oldParent) document.body.append(styleNode);
        const cssRuleList: CSSRuleList = styleNode.sheet!.cssRules || styleNode.sheet!.rules;
        this.all = [...cssRuleList as any];
        if (!oldParent) document.body.removeChild(styleNode);
        // if (se aveva parent rimane attaccato lì e non serve fare questo) oldParent.append(styleNode);
    }

    public getCSSMediaRule(): CSSMediaRule[]{
        return this.all.filter( (e, i): boolean => { return e instanceof CSSMediaRule; }) as any[];
    }
    public getCSSStyleRule(): CSSStyleRule[]{
        return this.all.filter( (e, i): boolean  => { return e instanceof CSSStyleRule; }) as any[];
    }
    public notIn(list:CSSStyleRule[]): CSSStyleRule[] {
        return this.all.filter( (e, i): boolean  => { return list.indexOf(e) !== -1; });
    }
}


export class CSSParser {
    static parse(styleNode: HTMLStyleElement): CSSRuleSorted { return new CSSRuleSorted(styleNode); }
}
