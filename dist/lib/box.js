/**
 * Box calculation functions
 *
 * @module
 */
/**
 * Convert relative box to absolute box
 *
 * @param box relative or absolute box
 * @returns absolute box
 */
export function absBox(box) {
    if ('right' in box && 'bottom' in box) {
        return box;
    }
    return {
        left: box.left,
        top: box.top,
        right: box.left + box.width - 1,
        bottom: box.top + box.height - 1
    };
}
/**
 * Alter box coordinates to fit within a bitmap, and optionally expand the box
 *
 * @param mapWidth bitmap width
 * @param mapHeight bitmap height
 * @param box original box coordinates
 * @param grow add this many pixels to each side of the box
 * @returns box with adjusted coordinates
 */
export function fitBox(mapWidth, mapHeight, box, grow = 0) {
    box = absBox(box);
    return {
        left: Math.max(0, box.left - grow),
        top: Math.max(0, box.top - grow),
        right: Math.min(mapWidth - 1, box.right + grow),
        bottom: Math.min(mapHeight - 1, box.bottom + grow)
    };
}
/**
 * Convert box to points at each corner
 *
 * @param box relative or absolute box
 * @returns box with points at each corner
 */
export function boxPoints(box) {
    box = absBox(box);
    return {
        topLeft: { x: box.left, y: box.top },
        topRight: { x: box.right, y: box.top },
        bottomLeft: { x: box.left, y: box.bottom },
        bottomRight: { x: box.right, y: box.bottom }
    };
}
/**
 * Check whether box contains a point
 * @param box relative or absolute box
 * @param p point to check
 * @returns
 */
export function boxContainsPoint(box, p) {
    box = absBox(box);
    return (p.x >= box.left &&
        p.x <= box.right &&
        p.y >= box.top &&
        p.y <= box.bottom);
}
/**
 * Check whether two boxes share any points
 *
 * @param box1 box to test
 * @param box2 box to test
 * @returns true if boxes overlap
 */
export function boxIntersect(box1, box2) {
    function checkBoxPointsInBox(box, points) {
        return (boxContainsPoint(box, points.topLeft) ||
            boxContainsPoint(box, points.topRight) ||
            boxContainsPoint(box, points.bottomLeft) ||
            boxContainsPoint(box, points.bottomRight));
    }
    function checkLineIntersect(p1, p2, q1, q2) {
        if (p1.x === p2.x && q1.y === q2.y) {
            return (q1.x <= p1.x &&
                q2.x >= p2.x &&
                q1.y >= p1.y &&
                q1.y <= p2.y);
        }
        if (p1.y === p2.y && q1.x === q2.x) {
            return (p1.x <= q1.x &&
                p2.x >= q2.x &&
                p1.y >= q1.y &&
                p1.y <= q2.y);
        }
        return false;
    }
    function checkBoxLinesIntersect(a, b) {
        return (checkLineIntersect(a.topLeft, a.bottomLeft, b.topLeft, b.topRight) ||
            checkLineIntersect(a.topLeft, a.bottomLeft, b.bottomLeft, b.bottomRight) ||
            checkLineIntersect(a.topRight, a.bottomRight, b.topLeft, b.topRight) ||
            checkLineIntersect(a.topRight, a.bottomRight, b.bottomLeft, b.bottomRight) ||
            checkLineIntersect(b.topLeft, b.bottomLeft, a.topLeft, a.topRight) ||
            checkLineIntersect(b.topLeft, b.bottomLeft, a.bottomLeft, a.bottomRight) ||
            checkLineIntersect(b.topRight, b.bottomRight, a.topLeft, a.topRight) ||
            checkLineIntersect(b.topRight, b.bottomRight, a.bottomLeft, a.bottomRight));
    }
    box1 = absBox(box1);
    box2 = absBox(box2);
    const points1 = boxPoints(box1);
    const points2 = boxPoints(box2);
    return (checkBoxPointsInBox(box2, points1) ||
        checkBoxPointsInBox(box1, points2) ||
        checkBoxLinesIntersect(points1, points2));
}
