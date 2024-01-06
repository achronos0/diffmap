/**
 * Box calculation functions
 *
 * @module
 */
import { Point } from './types.js';
/**
 * Box with absolute coordinates
 */
export interface AbsBox {
    left: number;
    top: number;
    right: number;
    bottom: number;
}
/**
 * Box with relative coordinates
 */
export interface RelBox {
    left: number;
    top: number;
    width: number;
    height: number;
}
/**
 * Box with absolute or relative coordinates
 */
export type AnyBox = RelBox | AbsBox;
/**
 * Box with absolute coordinates and points at each corner
 */
export interface BoxPoints {
    topLeft: Point;
    topRight: Point;
    bottomLeft: Point;
    bottomRight: Point;
}
/**
 * Convert relative box to absolute box
 *
 * @param box relative or absolute box
 * @returns absolute box
 */
export declare function absBox(box: AnyBox): AbsBox;
/**
 * Alter box coordinates to fit within a bitmap, and optionally expand the box
 *
 * @param mapWidth bitmap width
 * @param mapHeight bitmap height
 * @param box original box coordinates
 * @param grow add this many pixels to each side of the box
 * @returns box with adjusted coordinates
 */
export declare function fitBox(mapWidth: number, mapHeight: number, box: AnyBox, grow?: number): AbsBox;
/**
 * Convert box to points at each corner
 *
 * @param box relative or absolute box
 * @returns box with points at each corner
 */
export declare function boxPoints(box: AnyBox): BoxPoints;
/**
 * Check whether box contains a point
 * @param box relative or absolute box
 * @param p point to check
 * @returns
 */
export declare function boxContainsPoint(box: AnyBox, p: Point): boolean;
/**
 * Check whether two boxes share any points
 *
 * @param box1 box to test
 * @param box2 box to test
 * @returns true if boxes overlap
 */
export declare function boxIntersect(box1: AnyBox, box2: AnyBox): boolean;
