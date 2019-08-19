import { ObjectType } from "./types";

const deepObjDiff = require('deep-object-diff') as {
    /** returns the difference of the original and updated objects */
    diff<T>(originalObj: any, updatedObj: any): T;

    /** returns only the values added to the updated object */
    addedDiff<T>(original: any, updatedObj: any): T;

    /** returns only the values deleted in the updated object */
    deletedDiff<T>(original: any, updatedObj: any): T;

    /** returns only the values that have been changed in the updated object */
    updatedDiff<T>(original: any, updatedObj: any): T;

    /** returns an object with the added, deleted and updated differences */
    detailedDiff<T>(original: any, updatedObj: any): {
        added: T,
        deleted: T,
        updated: T,
    };
};

type Diff = {
    added: {
        path: string,
        value: string,
    }[],
    
    deleted: {
        path: string,
    }[],
    
    changed: {
        path: string,
        value: string,
    }[],
};

export function makeDiff(objectsOld: ObjectType[], objectsNew: ObjectType[]): Diff {
    const objectsOldMap = objectsOld.reduce((sum, x) => 
        Object.assign(sum, {
            [x.name]: x,
        }), {}
    );
    const objectsNewMap = objectsNew.reduce((sum, x) => 
        Object.assign(sum, {
            [x.name]: x,
        }), {}
    );

    const diff = deepObjDiff.detailedDiff(objectsOldMap, objectsNewMap);

    const added: {
        path: string,
        value: string,
    }[] = [];

    const deleted: {
        path: string,
    }[] = [];

    const changed: {
        path: string,
        value: string,
    }[] = [];

    travelPush(diff.added, (path, value) => added.push({ path, value }));
    travelPush(diff.deleted, (path) => deleted.push({ path }));
    travelPush(diff.updated, (path, value) => changed.push({ path, value }));

    return {
        added,
        deleted,
        changed,
    };
}

function travelPush(
    tree: any,
    push: (field: string, value: any) => void,
    _curField: string = '',
) {
    for (const k in tree) {
        if (typeof tree[k] !== 'object') {
            push((_curField ? _curField + '.' : '') + k, tree[k]);
        } else {
            travelPush(tree[k], push, (_curField ? _curField + '.' : '') + k);
        }
    }
}

export function printMarkdownDiff(diff: Diff): string {
    return [
        '# Added',
        diff.added.map(x => '* `' + x.path + '` = `' + x.value + '`').join('\n'),
        '# Changed',
        diff.changed.map(x => '* `' + x.path + '` = `' + x.value + '`').join('\n'),
        '# Deleted',
        diff.deleted.map(x => '* `' + x.path + '`').join('\n'),
    ].join('\n');
}