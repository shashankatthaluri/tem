import { View, StyleSheet } from "react-native";
import Svg, { Path, G, Text as SvgText } from "react-native-svg";
import { useExpenseStore } from "../store/expenseStore";
import { typography } from "../theme/typography";

interface ExpensePieChartProps {
    selectedCategory: string | null;
    onSlicePress: (category: string) => void;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    if (endAngle - startAngle >= 360) {
        return `M ${x} ${y - radius} A ${radius} ${radius} 0 1 1 ${x} ${y + radius} A ${radius} ${radius} 0 1 1 ${x} ${y - radius}`;
    }

    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);
    var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    var d = [
        "M", x, y,
        "L", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        "Z"
    ].join(" ");

    return d;
}

export function ExpensePieChart({ selectedCategory, onSlicePress }: ExpensePieChartProps) {
    const { categoryTotals } = useExpenseStore();

    const entries = Object.entries(categoryTotals);
    const total = entries.reduce((sum, [_, val]) => sum + val, 0);

    let currentAngle = 0;
    const radius = 100;
    const cx = 130;
    const cy = 130;

    const selectedAmount = selectedCategory ? categoryTotals[selectedCategory] : 0;

    return (
        <View style={styles.wrap}>
            <Svg width={260} height={260} viewBox="0 0 260 260">
                <G>
                    {entries.map(([cat, val]) => {
                        if (val === 0) return null;
                        const angle = (val / total) * 360;
                        const path = describeArc(cx, cy, radius, currentAngle, currentAngle + angle);

                        const isSelected = selectedCategory === cat;
                        const isDimmed = selectedCategory !== null && !isSelected;

                        const slice = (
                            <Path
                                key={cat}
                                d={path}
                                fill={isSelected ? "#2A2A2A" : "transparent"}
                                stroke="#FFFFFF"
                                strokeWidth={isSelected ? "1.5" : "1"}
                                opacity={isDimmed ? 0.3 : 1}
                                onPress={() => onSlicePress(cat)}
                            />
                        );

                        currentAngle += angle;
                        return slice;
                    })}
                </G>
                {selectedCategory && (
                    <SvgText
                        x={cx}
                        y={cy}
                        fill="#FFF"
                        fontSize="24"
                        fontFamily={typography.medium.fontFamily}
                        textAnchor="middle"
                        alignmentBaseline="middle"
                    >
                        {selectedAmount.toLocaleString()}
                    </SvgText>
                )}
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
