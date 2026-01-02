/**
 * Expense Pie Chart Component
 * 
 * Displays expense breakdown by category as a pie chart.
 * - All slices are uniform black/gray (minimal philosophy)
 * - Numbers and categories ONLY show when slice is selected
 * - Category labels curve along the outer arc
 * - Uses touch coordinate detection for mobile compatibility
 * - Tap to select, tap again to navigate to history
 */

import { View, StyleSheet, Pressable, GestureResponderEvent } from "react-native";
import Svg, { Path, G, Text as SvgText, Circle, Defs, TextPath } from "react-native-svg";
import { useCategoryTotals } from "../store/expenseStore";
import { typography } from "../theme/typography";
import { useRouter } from "expo-router";
import { useRef } from "react";

// ============================================================================
// Types
// ============================================================================

interface ExpensePieChartProps {
    selectedCategory: string | null;
    onSlicePress: (category: string) => void;
    onDeselect?: () => void;
}

interface SliceData {
    category: string;
    amount: number;
    startAngle: number;
    endAngle: number;
    midAngle: number;
    sliceAngle: number;
}

// ============================================================================
// Geometry Helpers
// ============================================================================

function polarToCartesian(cx: number, cy: number, radius: number, angleDegrees: number) {
    const angleRadians = (angleDegrees - 90) * Math.PI / 180.0;
    return {
        x: cx + (radius * Math.cos(angleRadians)),
        y: cy + (radius * Math.sin(angleRadians))
    };
}

function cartesianToPolar(cx: number, cy: number, x: number, y: number) {
    const dx = x - cx;
    const dy = y - cy;
    const radius = Math.sqrt(dx * dx + dy * dy);
    // Convert to angle in degrees (0 at top, clockwise)
    let angle = Math.atan2(dx, -dy) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    return { radius, angle };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
    if (endAngle - startAngle >= 360) {
        return `M ${x} ${y - radius} A ${radius} ${radius} 0 1 1 ${x} ${y + radius} A ${radius} ${radius} 0 1 1 ${x} ${y - radius}`;
    }

    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
        "M", x, y,
        "L", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        "Z"
    ].join(" ");
}

function describeArcPath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
    const start = polarToCartesian(cx, cy, radius, startAngle);
    const end = polarToCartesian(cx, cy, radius, endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function getSliceCenter(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
    const midAngle = startAngle + (endAngle - startAngle) / 2;
    const centerRadius = radius * 0.55;
    return polarToCartesian(cx, cy, centerRadius, midAngle);
}

function formatAmount(amount: number): string {
    return amount.toLocaleString();
}

// ============================================================================
// Component
// ============================================================================

export function ExpensePieChart({ selectedCategory, onSlicePress, onDeselect }: ExpensePieChartProps) {
    const categoryTotals = useCategoryTotals();
    const router = useRouter();
    const containerRef = useRef<View>(null);

    const entries = Object.entries(categoryTotals).filter(([_, val]) => val > 0);
    const total = entries.reduce((sum, [_, val]) => sum + val, 0);

    // Chart dimensions
    const chartSize = 300;
    const cx = 150;
    const cy = 150;
    const baseRadius = 95;
    const selectedRadius = 105;
    const labelRadius = 115;

    // Calculate slice data
    let currentAngle = 0;
    const sliceData: SliceData[] = entries.map(([cat, val]) => {
        const angle = (val / total) * 360;
        const data: SliceData = {
            category: cat,
            amount: val,
            startAngle: currentAngle,
            endAngle: currentAngle + angle,
            midAngle: currentAngle + angle / 2,
            sliceAngle: angle,
        };
        currentAngle += angle;
        return data;
    });

    // Find which slice was tapped based on coordinates
    const findSliceAtPoint = (x: number, y: number): SliceData | null => {
        const { radius, angle } = cartesianToPolar(cx, cy, x, y);

        // Must be within the pie area (not too close to center, not too far)
        const minRadius = 15; // Ignore clicks very close to center
        const maxRadius = selectedRadius + 5;

        if (radius < minRadius || radius > maxRadius) {
            return null;
        }

        // Find matching slice by angle
        for (const slice of sliceData) {
            if (angle >= slice.startAngle && angle < slice.endAngle) {
                return slice;
            }
        }
        return null;
    };

    // Handle tap on chart
    const handlePress = (event: GestureResponderEvent) => {
        const { locationX, locationY } = event.nativeEvent;
        const slice = findSliceAtPoint(locationX, locationY);

        if (slice) {
            if (selectedCategory === slice.category) {
                // Second tap - navigate to history
                router.push({
                    pathname: "/category-history",
                    params: { category: slice.category, month: new Date().toISOString().slice(0, 7) }
                });
            } else {
                onSlicePress(slice.category);
            }
        } else {
            // Tapped outside slices - deselect
            if (selectedCategory && onDeselect) {
                onDeselect();
            }
        }
    };

    // Empty state
    if (entries.length === 0 || total === 0) {
        return (
            <View style={styles.wrap}>
                <Svg width={chartSize} height={chartSize} viewBox="0 0 300 300">
                    <Circle cx={cx} cy={cy} r={100} fill="#0A0A0A" stroke="#222" strokeWidth={1} />
                    <SvgText x={cx} y={cy + 5} fill="#444" fontSize="14" textAnchor="middle">
                        No expenses yet
                    </SvgText>
                </Svg>
            </View>
        );
    }

    const selectedSlice = sliceData.find(s => s.category === selectedCategory);

    return (
        <Pressable style={styles.wrap} onPress={handlePress}>
            <Svg width={chartSize} height={chartSize} viewBox="0 0 300 300">
                {/* Pie slices */}
                <G>
                    {sliceData.map((slice) => {
                        const isSelected = selectedCategory === slice.category;
                        const isDimmed = selectedCategory !== null && !isSelected;
                        const radius = isSelected ? selectedRadius : baseRadius;
                        const path = describeArc(cx, cy, radius, slice.startAngle, slice.endAngle);

                        return (
                            <Path
                                key={slice.category}
                                d={path}
                                fill={isSelected ? "#1A1A1A" : "#0A0A0A"}
                                stroke={isSelected ? "#444" : "#222"}
                                strokeWidth={isSelected ? 2 : 1}
                                opacity={isDimmed ? 0.25 : 1}
                            />
                        );
                    })}
                </G>

                {/* Show amount ONLY for selected slice */}
                {selectedSlice && (
                    <SvgText
                        x={getSliceCenter(cx, cy, selectedRadius, selectedSlice.startAngle, selectedSlice.endAngle).x}
                        y={getSliceCenter(cx, cy, selectedRadius, selectedSlice.startAngle, selectedSlice.endAngle).y}
                        fill="#FFFFFF"
                        fontSize={16}
                        fontFamily={typography.medium.fontFamily}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                    >
                        {formatAmount(selectedSlice.amount)}
                    </SvgText>
                )}

                {/* Show category name on outer arc ONLY for selected slice */}
                {selectedSlice && (
                    <G>
                        <Defs>
                            <Path
                                id="arcPath"
                                d={describeArcPath(
                                    cx, cy, labelRadius,
                                    selectedSlice.startAngle,
                                    selectedSlice.endAngle
                                )}
                            />
                        </Defs>
                        <SvgText
                            fill="#666"
                            fontSize={11}
                            fontFamily={typography.regular.fontFamily}
                        >
                            <TextPath href="#arcPath" startOffset="50%" textAnchor="middle">
                                {selectedSlice.category}
                            </TextPath>
                        </SvgText>
                    </G>
                )}

                {/* Center total when nothing selected */}
                {!selectedCategory && (
                    <SvgText
                        x={cx}
                        y={cy + 5}
                        fill="#FFFFFF"
                        fontSize={24}
                        fontFamily={typography.medium.fontFamily}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                    >
                        {formatAmount(total)}
                    </SvgText>
                )}
            </Svg>
        </Pressable>
    );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
    wrap: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
