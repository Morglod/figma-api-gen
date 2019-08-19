import puppeteer from 'puppeteer';
import { DOC_TYPE_ID, DOC_TYPES_IDS } from './constants';
import { PropType, ObjectType } from './types';

export async function reqParseDocs() {
    const browser = await puppeteer.launch({
        headless: false,
    });
    const page = await browser.newPage();
    await page.goto('https://www.figma.com/developers/docs', {
        timeout: 120000
    });

    const props = await page.evaluate((DOC_TYPES_IDS: DOC_TYPE_ID[]) => {
        const docData = window.document.body.innerHTML;

        const findHashedClass = (classPart: string, debugMsg?: string) => {
            const rxp = new RegExp(`\\"(${classPart}--(?:[\\w\\d]+))[\\"\\s]`);
            const match = rxp.exec(docData);
            if (!match) {
                throw new Error(`findHashedClass failed for "${classPart}"`);
            }
            const [,foundClass] = match;
            console.log(`${debugMsg} class "${foundClass}"`);

            return foundClass;
        };

        // prop table contains table where each row is:
        // { type name, type fields }
        const propTableClass = findHashedClass('developer_docs--propTable', 'prop table');

        // prop field is div with field description
        const propFieldClass = findHashedClass('developer_docs--propField', 'prop field');

        // field name class wrapper
        const monoDisplayClass = findHashedClass('developer_docs--monoDisplay', 'monoDisplay');

        // field type class wrapper
        const formatTypeClass = findHashedClass('format--type', 'format type');

        // field type class wrapper
        const defaultsDisplayClass = findHashedClass('developer_docs--defaultsDisplay', 'defaults display');

        // field type class wrapper
        const propDescClass = findHashedClass('developer_docs--propDesc', 'prop desc');

        // enum's value
        const formatStringClass = findHashedClass('format--string', 'format string');
    
        const types: ObjectType[] = [];

        const pickPropFields = (propTableRow: HTMLTableRowElement) => {
            const typeKeyEl = propTableRow.children.item(0)! as HTMLTableDataCellElement;
            const typeValueEl = propTableRow.children.item(1)! as HTMLTableDataCellElement;

            let typeName = '', typeDesc = '';
            if (typeKeyEl.children.length === 2) {
                const nameEl = typeKeyEl.children.item(0)! as HTMLElement;
                const descEl = typeKeyEl.children.item(1)! as HTMLElement;

                if (!nameEl) {
                    console.error(`nameEl not found for keyEl`);
                    return;
                }

                typeName = nameEl.innerText;
                if (descEl) typeDesc = descEl.innerText;
            } else {
                typeName = typeKeyEl.innerText;
            }

            let props: PropType[] = [];

            let otherOptional = false;

            const propFieldEls = typeValueEl.querySelectorAll(`.${propFieldClass}`);
            propFieldEls.forEach((propFieldEl, propFieldIndex) => {
                const fieldNameEl = (propFieldEl.querySelector(`.${monoDisplayClass}`)! as HTMLDivElement);
                const fieldTypeEl = (propFieldEl.querySelector(`.${formatTypeClass}`)! as HTMLDivElement);
                const fieldDescEl = (propFieldEl.querySelector(`.${propDescClass}`)! as HTMLDivElement);
                const fieldDefaultEl = (propFieldEl.querySelector(`.${defaultsDisplayClass}`)! as HTMLDivElement);
                
                const fieldName = fieldNameEl ? fieldNameEl.innerText : '';
                const fieldType = fieldTypeEl ? fieldTypeEl.innerText : '';
                const fieldDesc = fieldDescEl ? fieldDescEl.innerText : '';
                const fieldDefault = fieldDefaultEl ? fieldDefaultEl.innerText.substr('default: '.length) : '';

                const enumValues: string[] = [];

                const enumEls = fieldDescEl.querySelectorAll(`.${formatStringClass}`);
                enumEls.forEach(enumEl => {
                    enumValues.push((enumEl as HTMLDivElement).innerText);
                });

                if (fieldDesc.startsWith('The following properties') || fieldDesc.startsWith('For ')) {
                    otherOptional = true;
                    return;
                }

                const p = {
                    name: fieldName,
                    type: fieldType,
                    desc: fieldDesc,
                    default: fieldDefault,
                    enumValues,
                    isEnum: fieldType === 'String' && enumValues.length !== 0,
                    optional: otherOptional,
                };

                props.push(p);
            });

            let extendsType = '';

            const extendsProp = props.find(x =>
                x.desc.startsWith('See properties for ') ||
                x.desc.startsWith('Has all the properties of ')
            );

            if (extendsProp) {
                props = props.filter(x => x !== extendsProp);

                if (extendsProp.desc.startsWith('See properties for ')) {
                    extendsType = extendsProp.desc.substr('See properties for '.length).trim();
                }
                else if (extendsProp.desc.startsWith('Has all the properties of ')) {
                    const s = extendsProp.desc.substr('Has all the properties of '.length).trim();
                    extendsType = s.substr(0, s.indexOf(','));
                }
            }

            let enumValues: string[] = [];

            if (props.length === 2 && props[0].desc === 'This type is a string enum with the following possible values') {
                enumValues = props[1].enumValues;
                props = [];
            }

            return {
                name: typeName,
                desc: typeDesc,
                props,
                extends: extendsType,
                enumValues,
                isEnum: enumValues.length !== 0,
            };
        };

        const serializeDocPartTypes = (docPartId: DOC_TYPE_ID) => {
            const propTables = document.querySelectorAll(`#${docPartId} .${propTableClass}`);
            propTables.forEach(pt => {
                const rows = pt.querySelectorAll('tbody > tr');
                rows.forEach((row) => {
                    const x = pickPropFields(row as HTMLTableRowElement);
                    x && types.push(x);
                });
            });
        };

        DOC_TYPES_IDS.forEach(x => serializeDocPartTypes(x));

        return types;
    }, DOC_TYPES_IDS as any);
  
    await browser.close();

    // append default types

    props.push({
        name: 'Path',
        extends: '',
        desc: 'A vector svg path',
        props: [
            {
                name: 'path',
                type: 'String',
                desc: 'A sequence of path commands in SVG notation',
                default: '',
                enumValues: [],
                isEnum: false,
                optional: false,
            },
            {
                name: 'windingRule',
                type: 'String',
                desc: 'Winding rule for the path, either "EVENODD" or "NONZERO"',
                default: '',
                enumValues: [
                    'EVENODD',
                    'NONZERO',
                ],
                isEnum: true,
                optional: false,
            }
        ],
        isEnum: false,
        enumValues: [],
    });

    props.push({
        name: 'StyleType',
        extends: '',
        desc: '',
        props: [],
        isEnum: true,
        enumValues: [
            'FILL',
            'TEXT',
            'EFFECT',
            'GRID'
        ],
    });

    props.push({
        name: 'PageInfo',
        extends: '',
        desc: `UNDOCUMENTED\nData on component's containing page, if component resides in a multi-page file`,
        props: [],
        isEnum: false,
        enumValues: [],
    });

    // Make partial type for TEXT.styleOverrideTable option

    const TypeStyle = props.find(x => x.name === 'TypeStyle');

    props.push({
        ...TypeStyle!,
        name: 'TypeStylePartial',
        props: TypeStyle!.props.map(x => ({
            ...x,
            optional: true,
        })),
    });

    props.find(x => x.name === 'TEXT')!.props.find(x => x.name === 'styleOverrideTable')!.type = 'TypeStylePartial';

    // TODO: mark 'may be null' fields

    const mayBeNull = {
        TypeStyle: [ 'fontPostScriptName', ],
        CANVAS: [ 'prototypeStartNodeID', ]
    };

    const mayBeOptional = {
        TypeStyle: [ 'lineHeightPercentFontSize', 'paragraphIndent', 'italic', 'textCase', 'textDecoration', 'fills', 'paragraphSpacing', ],
        Paint: [ 'visible', 'opacity', ]
    };

    for (const [ t, f ] of Object.entries(mayBeNull)) {
        const typ = props.find(x => x.name === t);
        for (const fieldName of f) {
            const typ_field = typ!.props.find(x => x.name === fieldName);
            typ_field!.mayBeNull = true;
        }
    }

    for (const [ t, f ] of Object.entries(mayBeOptional)) {
        const typ = props.find(x => x.name === t);
        for (const fieldName of f) {
            const typ_field = typ!.props.find(x => x.name === fieldName);
            typ_field!.optional = true;
        }
    }

    return props;
}