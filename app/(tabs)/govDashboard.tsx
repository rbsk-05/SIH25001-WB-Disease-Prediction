import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from "react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";

export default function GovDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const screenWidth = Dimensions.get("window").width;

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>📊 Assam Health & Water Overview</Text>

            {/* Disease Trend Chart */}
            <Text style={styles.chartTitle}>Disease Cases (Last 6 Months)</Text>
            <LineChart
              data={{
                labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"],
                datasets: [{ data: [120, 145, 90, 200, 170, 140] }],
              }}
              width={screenWidth - 30}
              height={220}
              yAxisSuffix=" cases"
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />

            {/* District-wise Water Quality */}
            <Text style={styles.chartTitle}>Avg pH Level by District</Text>
            <BarChart
              data={{
                labels: ["Guwahati", "Dibrugarh", "Jorhat", "Silchar", "Tezpur"],
                datasets: [{ data: [7.2, 6.8, 7.1, 6.9, 7.3] }],
              }}
              width={screenWidth - 30}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
            />

            {/* Pie Chart for Alerts */}
            <Text style={styles.chartTitle}>Alerts in Assam</Text>
            <PieChart
              data={[
                { name: "Water Contamination", population: 35, color: "#FF6384", legendFontColor: "#000", legendFontSize: 12 },
                { name: "Disease Outbreak", population: 30, color: "#36A2EB", legendFontColor: "#000", legendFontSize: 12 },
                { name: "Flood Risk", population: 20, color: "#FFCE56", legendFontColor: "#000", legendFontSize: 12 },
                { name: "Other", population: 15, color: "#4BC0C0", legendFontColor: "#000", legendFontSize: 12 },
              ]}
              width={screenWidth - 30}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />

            {/* Bottom Padding so content isn't hidden */}
            <View style={{ height: 80 }} />
          </ScrollView>
        );

      case "alerts":
        return (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>🚨 Active Alerts in Assam</Text>
            <Text>- Guwahati: Water contamination in ward 12</Text>
            <Text>- Dibrugarh: Malaria spike reported</Text>
            <Text>- Silchar: Heavy rainfall alert</Text>
          </ScrollView>
        );

      case "workers":
        return (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>👩‍⚕️ ASHA Workers (Assam)</Text>
            <Text>- Worker 1 (Guwahati) → 15 reports submitted</Text>
            <Text>- Worker 2 (Dibrugarh) → 10 reports submitted</Text>
            <Text>- Worker 3 (Jorhat) → 18 reports submitted</Text>
          </ScrollView>
        );

      case "verification":
        return (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>✅ Verification</Text>
            <Text>- 3 pending worker certificate verifications</Text>
            <Text>- 2 approved this week</Text>
          </ScrollView>
        );

      case "profile":
        return (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>👤 Govt Official Profile</Text>
            <Text>- Name: District Officer, Assam</Text>
            <Text>- Role: Health & Water Monitoring</Text>
            <Text>- Logout option</Text>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Active Tab Content */}
      {renderContent()}

      {/* Bottom Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity onPress={() => setActiveTab("overview")} style={styles.tab}>
          <Text style={activeTab === "overview" ? styles.activeTab : styles.inactiveTab}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("alerts")} style={styles.tab}>
          <Text style={activeTab === "alerts" ? styles.activeTab : styles.inactiveTab}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("workers")} style={styles.tab}>
          <Text style={activeTab === "workers" ? styles.activeTab : styles.inactiveTab}>Workers</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("verification")} style={styles.tab}>
          <Text style={activeTab === "verification" ? styles.activeTab : styles.inactiveTab}>Verify</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("profile")} style={styles.tab}>
          <Text style={activeTab === "profile" ? styles.activeTab : styles.inactiveTab}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.7,
  useShadowColorFromDataset: false,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 20,
    paddingBottom: 100, // ensures space above bottom tab
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  chartTitle: { fontSize: 16, fontWeight: "600", marginVertical: 10 },
  chart: { marginVertical: 10, borderRadius: 12 },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
  },
  tab: { padding: 8 },
  activeTab: { fontWeight: "bold", color: "#007AFF" },
  inactiveTab: { color: "#888" },
});
