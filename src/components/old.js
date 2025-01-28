export function parseNewick(newickString: string): TreeNode {
    const stack: TreeNode[] = [];
    let currentNode: TreeNode = {};

    const tokens = newickString.split(/\s*(;|\(|\)|,|:)\s*/);

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        switch (token) {
            case "(": {
                const childNode: TreeNode = {};
                currentNode.branchset = [childNode];
                stack.push(currentNode);
                currentNode = childNode;
                break;
            }
            case ",": {
                const childNode: TreeNode = {};
                stack[stack.length - 1].branchset?.push(childNode);
                currentNode = childNode;
                break;
            }
            case ")":
                currentNode = stack.pop() || {};
                break;
            case ":":
                break;
            default: {
                const previousToken = tokens[i - 1];
                if (previousToken === ")" || previousToken === "(" || previousToken === ",") {
                    currentNode.name = token;
                } else if (previousToken === ":") {
                    const length = parseFloat(token);
                    if (!isNaN(length)) {
                        currentNode.length = length;
                    }
                }
            }
        }
    }

    return currentNode;
}