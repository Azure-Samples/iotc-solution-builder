export function createSelectOptionsFromEnum(enumObject: any, valueEnum: boolean): any[] {
    const length = Object.keys(enumObject).length / (valueEnum ? 2 : 1);

    const options = [];
    let index = 0;

    // eslint-disable-next-line guard-for-in
    for (const prop in enumObject) {
        if (index >= length) {
            break;
        }

        options.push(
            {
                key: enumObject[enumObject[prop]],
                text: enumObject[prop],
                value: valueEnum ? enumObject[enumObject[prop]] : enumObject[prop]
            }
        );

        ++index;
    }

    return options;
}
