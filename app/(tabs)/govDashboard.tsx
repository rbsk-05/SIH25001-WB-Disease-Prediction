import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
  Alert,
} from "react-native";
import { BarChart, PieChart, LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

// Update this to match your server IP
const BASE_URL = "http://192.168.137.23:5000";

export default function GovDashboard() {
  const [activeTab, setActiveTab] = useState<"Health" | "Water" | "Profile">("Health");

  const renderTab = () => {
    switch (activeTab) {
      case "Health":
        return <HealthDashboard />;
      case "Water":
        return <WaterDashboard />;
      case "Profile":
        return <ProfileDashboard />;
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>{renderTab()}</View>

      <View style={styles.navBar}>
        {["Health", "Water", "Profile"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.navButton,
              activeTab === tab && styles.activeNavButton,
            ]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text
              style={[
                styles.navText,
                activeTab === tab && styles.activeNavText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// -------------------------
// Health Dashboard Component
// -------------------------
function HealthDashboard() {
  const [healthData, setHealthData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ 
    total: 0, 
    avgAge: 0, 
    maleCount: 0, 
    femaleCount: 0,
    poorSanitation: 0,
    goodSanitation: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setHealthData(data);
      
      // Calculate summary statistics
      const total = data.length;
      const avgAge = total > 0 
        ? data.reduce((sum: number, d: any) => sum + Number(d.age || 0), 0) / total 
        : 0;
      
      const maleCount = data.filter((d: any) => d.gender === 'male').length;
      const femaleCount = data.filter((d: any) => d.gender === 'female').length;
      const poorSanitation = data.filter((d: any) => d.sanitation === 'poor').length;
      const goodSanitation = data.filter((d: any) => d.sanitation === 'good').length;
      
      setSummary({ 
        total, 
        avgAge, 
        maleCount, 
        femaleCount, 
        poorSanitation, 
        goodSanitation 
      });
    } catch (err) {
      console.error("Failed to fetch health data:", err);
      Alert.alert("Error", "Failed to load health data. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading health data...</Text>
      </View>
    );
  }

  // Calculate symptom statistics
  const symptomCounts: { [key: string]: number } = {};
  healthData.forEach((d: any) => {
    if (d.symptoms) {
      Object.entries(d.symptoms).forEach(([symptom, value]) => {
        if (value) symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
      });
    }
  });

  const topSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const symptomChartData = {
    labels: topSymptoms.map(([name]) => name.replace('_', ' ')),
    datasets: [{ data: topSymptoms.map(([_, count]) => count) }],
  };

  // Age distribution
  const ageCounts: { [key: string]: number } = {};
  healthData.forEach((d: any) => {
    const age = Number(d.age || 0);
    const bucket =
      age < 20 ? "<20"
      : age < 30 ? "20-29"
      : age < 40 ? "30-39"
      : age < 50 ? "40-49"
      : age < 60 ? "50-59"
      : "60+";
    ageCounts[bucket] = (ageCounts[bucket] || 0) + 1;
  });

  const ageChartData = {
    labels: Object.keys(ageCounts),
    datasets: [{ data: Object.values(ageCounts) }],
  };

  return (
    <ScrollView style={styles.scroll}>
      {/* Refresh Button */}
      <View style={styles.headerContainer}>
        <Text style={styles.dashboardTitle}>Health Analytics Dashboard</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchHealthData}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.cardsContainer}>
        <View style={[styles.card, styles.gradient1]}>
          <Text style={styles.cardTitle}>Total Submissions</Text>
          <Text style={styles.cardValue}>{summary.total}</Text>
        </View>
        <View style={[styles.card, styles.gradient2]}>
          <Text style={styles.cardTitle}>Average Age</Text>
          <Text style={styles.cardValue}>{summary.avgAge.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.cardsContainer}>
        <View style={[styles.card, styles.gradient3]}>
          <Text style={styles.cardTitle}>Poor Sanitation</Text>
          <Text style={styles.cardValue}>{summary.poorSanitation}</Text>
        </View>
        <View style={[styles.card, styles.gradient4]}>
          <Text style={styles.cardTitle}>Good Sanitation</Text>
          <Text style={styles.cardValue}>{summary.goodSanitation}</Text>
        </View>
      </View>

      {/* Top Symptoms Chart */}
      {topSymptoms.length > 0 && (
        <>
          <Text style={styles.chartTitle}>Top Reported Symptoms</Text>
          <BarChart
            data={symptomChartData}
            width={screenWidth - 32}
            height={280}
            fromZero
            showValuesOnTopOfBars
            withInnerLines={false}
            chartConfig={{
              backgroundGradientFrom: "#f0f2f5",
              backgroundGradientTo: "#f0f2f5",
              decimalPlaces: 0,
              color: () => "#D32F2F",
              labelColor: () => "#000",
              style: { borderRadius: 12 },
            }}
            style={{ marginVertical: 16, borderRadius: 12 }}
          />
        </>
      )}

      {/* Age Distribution Chart */}
      {Object.keys(ageCounts).length > 0 && (
        <>
          <Text style={styles.chartTitle}>Age Distribution</Text>
          <BarChart
            data={ageChartData}
            width={screenWidth - 32}
            height={280}
            fromZero
            showValuesOnTopOfBars
            withInnerLines={false}
            chartConfig={{
              backgroundGradientFrom: "#f0f2f5",
              backgroundGradientTo: "#f0f2f5",
              decimalPlaces: 0,
              color: () => "#388E3C",
              labelColor: () => "#000",
              style: { borderRadius: 12 },
            }}
            style={{ marginVertical: 16, borderRadius: 12 }}
          />
        </>
      )}

            {/* Recent Submissions */}
      <View style={styles.recentContainer}>
  <Text style={styles.sectionTitle}>Recent Submissions</Text>
  {healthData
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // newest first
    .slice(0, 3) // take only the first 3 entries
    .map((entry, index) => (
      <View key={index} style={styles.recentEntry}>
        <Text style={styles.entryText}>
          <Text style={styles.entryLabel}>Age: </Text>{entry.age || 'N/A'}
        </Text>
        <Text style={styles.entryText}>
          <Text style={styles.entryLabel}>Gender: </Text>{entry.gender || 'N/A'}
        </Text>
        <Text style={styles.entryText}>
          <Text style={styles.entryLabel}>Sanitation: </Text>{entry.sanitation || 'N/A'}
        </Text>
        {/* Optional: display top symptoms */}
        {entry.symptoms && (
          <Text style={styles.entryText}>
            <Text style={styles.entryLabel}>Symptoms: </Text>
            {Object.entries(entry.symptoms)
              .filter(([_, value]) => value)
              .map(([symptom]) => symptom.replace('_', ' '))
              .join(', ') || 'None'}
          </Text>
        )}
      </View>
    ))
  }
</View>


    </ScrollView>
  );
}

// -------------------------
// Water Dashboard Component
// -------------------------
function WaterDashboard() {
  const [waterData, setWaterData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ 
    total: 0, 
    avgPh: 0, 
    avgTurbidity: 0,
    avgTemperature: 0,
    avgChlorine: 0,
    avgDissolvedOxygen: 0,
    avgTds: 0
  });
  const [typeDistribution, setTypeDistribution] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
  const testWaterAPI = async () => {
    try {
      const response = await fetch('http://192.168.196.1:5000/water'); // replace with your PC LAN IP
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      console.log("✅ Water API response:", data.slice(0, 5)); // just first 5 records
    } catch (err) {
      console.error("❌ Failed to fetch /water:", err);
    }
  };

  testWaterAPI();
}, []);

  // Helper function to safely parse numbers
  const safeParseFloat = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const fetchWaterData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/water`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Water data sample:", data.slice(0, 2)); // Debug log
      setWaterData(data);

      // Calculate summary statistics with better number parsing
      const total = data.length;
      
      // Only calculate averages for records that have valid numeric values
      const validPhRecords = data.filter(d => safeParseFloat(d.ph) > 0);
      const validTurbidityRecords = data.filter(d => safeParseFloat(d.turbidity) > 0);
      const validTemperatureRecords = data.filter(d => safeParseFloat(d.temperature) > 0);
      const validChlorineRecords = data.filter(d => safeParseFloat(d.chlorine) > 0);
      const validDoRecords = data.filter(d => safeParseFloat(d.dissolvedOxygen) > 0);
      const validTdsRecords = data.filter(d => safeParseFloat(d.tds) > 0);

      const avgPh = validPhRecords.length > 0 
        ? validPhRecords.reduce((sum: number, d: any) => sum + safeParseFloat(d.ph), 0) / validPhRecords.length 
        : 0;
      const avgTurbidity = validTurbidityRecords.length > 0
        ? validTurbidityRecords.reduce((sum: number, d: any) => sum + safeParseFloat(d.turbidity), 0) / validTurbidityRecords.length
        : 0;
      const avgTemperature = validTemperatureRecords.length > 0
        ? validTemperatureRecords.reduce((sum: number, d: any) => sum + safeParseFloat(d.temperature), 0) / validTemperatureRecords.length
        : 0;
      const avgChlorine = validChlorineRecords.length > 0
        ? validChlorineRecords.reduce((sum: number, d: any) => sum + safeParseFloat(d.chlorine), 0) / validChlorineRecords.length
        : 0;
      const avgDissolvedOxygen = validDoRecords.length > 0
        ? validDoRecords.reduce((sum: number, d: any) => sum + safeParseFloat(d.dissolvedOxygen), 0) / validDoRecords.length
        : 0;
      const avgTds = validTdsRecords.length > 0
        ? validTdsRecords.reduce((sum: number, d: any) => sum + safeParseFloat(d.tds), 0) / validTdsRecords.length
        : 0;

      setSummary({ 
        total, 
        avgPh, 
        avgTurbidity, 
        avgTemperature, 
        avgChlorine, 
        avgDissolvedOxygen,
        avgTds 
      });

      // Calculate water source type distribution
      const typeCounts: { [key: string]: number } = {};
      data.forEach((d: any) => {
        const type = d.waterSourceType || "Unknown";
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      const colors = ["#1E88E5", "#43A047", "#FB8C00", "#8E24AA", "#E53935", "#00ACC1", "#D81B60"];
      const pieData = Object.entries(typeCounts).map(([type, count], i) => ({
        name: type.replace('_', ' '),
        population: count,
        color: colors[i % colors.length],
        legendFontColor: "#333",
        legendFontSize: 12,
      }));

      setTypeDistribution(pieData);
    } catch (err) {
      console.error("Failed to fetch water data:", err);
      Alert.alert("Error", "Failed to load water data. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading water data...</Text>
      </View>
    );
  }

  // Monthly trend analysis
  const monthlyData: { [key: string]: number } = {};
  waterData.forEach((d: any) => {
    if (d.month) {
      monthlyData[d.month] = (monthlyData[d.month] || 0) + 1;
    }
  });

  const monthlyChartData = {
    labels: Object.keys(monthlyData).slice(0, 6),
    datasets: [
      {
        data: Object.keys(monthlyData).length > 0 ? Object.values(monthlyData).slice(0, 6) : [0],
        color: () => "#1E88E5",
        strokeWidth: 2,
      },
    ],
  };

  // Season distribution
  const seasonCounts: { [key: string]: number } = {};
  waterData.forEach((d: any) => {
    if (d.season) {
      seasonCounts[d.season] = (seasonCounts[d.season] || 0) + 1;
    }
  });

  const seasonChartData = {
    labels: Object.keys(seasonCounts),
    datasets: [{ data: Object.values(seasonCounts) }],
  };

  // pH Level Distribution (categorized)
  const phCategories: { [key: string]: number } = {
    "Acidic (<6.5)": 0,
    "Normal (6.5-8.5)": 0,
    "Basic (>8.5)": 0
  };

  waterData.forEach((d: any) => {
    const ph = safeParseFloat(d.ph);
    if (ph > 0) {
      if (ph < 6.5) phCategories["Acidic (<6.5)"]++;
      else if (ph <= 8.5) phCategories["Normal (6.5-8.5)"]++;
      else phCategories["Basic (>8.5)"]++;
    }
  });

  const phChartData = {
    labels: Object.keys(phCategories),
    datasets: [{ data: Object.values(phCategories) }],
  };

  // Water Quality Comparison Chart
  const qualityMetrics = [
    { name: "pH", value: summary.avgPh, standard: 7.0 },
    { name: "Turbidity", value: summary.avgTurbidity, standard: 5.0 },
    { name: "Chlorine", value: summary.avgChlorine, standard: 0.5 },
    { name: "DO", value: summary.avgDissolvedOxygen, standard: 6.0 },
    { name: "TDS", value: summary.avgTds, standard: 500 }
  ];

  const qualityComparisonData = {
    labels: qualityMetrics.map(m => m.name),
    datasets: [
      {
        data: qualityMetrics.map(m => m.value),
        color: () => "#1E88E5",
      },
      {
        data: qualityMetrics.map(m => m.standard),
        color: () => "#4CAF50",
      }
    ],
  };

  return (
    <ScrollView style={styles.scroll}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.dashboardTitle}>Water Quality Dashboard</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchWaterData}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.cardsContainer}>
        <View style={[styles.card, styles.gradientBlue]}>
          <Text style={styles.cardTitle}>Total Samples</Text>
          <Text style={styles.cardValue}>{summary.total}</Text>
        </View>
        <View style={[styles.card, styles.gradientGreen]}>
          <Text style={styles.cardTitle}>Avg pH Level</Text>
          <Text style={styles.cardValue}>{summary.avgPh > 0 ? summary.avgPh.toFixed(1) : 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.cardsContainer}>
        <View style={[styles.card, styles.gradientOrange]}>
          <Text style={styles.cardTitle}>Avg Turbidity</Text>
          <Text style={styles.cardValue}>{summary.avgTurbidity > 0 ? summary.avgTurbidity.toFixed(1) : 'N/A'}</Text>
        </View>
        <View style={[styles.card, styles.gradientPurple]}>
          <Text style={styles.cardTitle}>Avg Temperature</Text>
          <Text style={styles.cardValue}>{summary.avgTemperature > 0 ? `${summary.avgTemperature.toFixed(1)}°C` : 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.cardsContainer}>
        <View style={[styles.card, styles.gradient1]}>
          <Text style={styles.cardTitle}>Avg Chlorine</Text>
          <Text style={styles.cardValue}>{summary.avgChlorine > 0 ? summary.avgChlorine.toFixed(2) : 'N/A'}</Text>
        </View>
        <View style={[styles.card, styles.gradient2]}>
          <Text style={styles.cardTitle}>Avg TDS</Text>
          <Text style={styles.cardValue}>{summary.avgTds > 0 ? summary.avgTds.toFixed(0) : 'N/A'}</Text>
        </View>
      </View>

      {/* Water Source Distribution */}
      {typeDistribution.length > 0 && (
        <>
          <Text style={styles.chartTitle}>Water Source Distribution</Text>
          <PieChart
            data={typeDistribution}
            width={screenWidth - 32}
            height={280}
            chartConfig={{
              backgroundColor: "#f0f2f5",
              backgroundGradientFrom: "#f0f2f5",
              backgroundGradientTo: "#f0f2f5",
              color: () => "#000",
              labelColor: () => "#000",
            }}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"16"}
            absolute
            style={{ marginVertical: 16, borderRadius: 12 }}
          />
        </>
      )}

      {/* pH Level Distribution */}
      {Object.values(phCategories).some(v => v > 0) && (
        <>
          <Text style={styles.chartTitle}>pH Level Distribution</Text>
          <BarChart
            data={phChartData}
            width={screenWidth - 32}
            height={220}
            fromZero
            showValuesOnTopOfBars
            withInnerLines={false}
            chartConfig={{
              backgroundGradientFrom: "#f0f2f5",
              backgroundGradientTo: "#f0f2f5",
              decimalPlaces: 0,
              color: () => "#FF6B35",
              labelColor: () => "#000",
              style: { borderRadius: 12 },
            }}
            style={{ marginVertical: 16, borderRadius: 12 }}
          />
        </>
      )}

      {/* Season Distribution */}
      {Object.keys(seasonCounts).length > 0 && (
        <>
          <Text style={styles.chartTitle}>Seasonal Data Collection</Text>
          <BarChart
            data={seasonChartData}
            width={screenWidth - 32}
            height={220}
            fromZero
            showValuesOnTopOfBars
            withInnerLines={false}
            chartConfig={{
              backgroundGradientFrom: "#f0f2f5",
              backgroundGradientTo: "#f0f2f5",
              decimalPlaces: 0,
              color: () => "#9C27B0",
              labelColor: () => "#000",
              style: { borderRadius: 12 },
            }}
            style={{ marginVertical: 16, borderRadius: 12 }}
          />
        </>
      )}

      {/* Water Quality vs Standards Comparison */}
      {qualityMetrics.some(m => m.value > 0) && (
        <>
          <Text style={styles.chartTitle}>Water Quality vs WHO Standards</Text>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: "#1E88E5" }]} />
              <Text style={styles.legendText}>Actual Values</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: "#4CAF50" }]} />
              <Text style={styles.legendText}>WHO Standards</Text>
            </View>
          </View>
          <BarChart
            data={qualityComparisonData}
            width={screenWidth - 32}
            height={250}
            fromZero
            showValuesOnTopOfBars
            withInnerLines={false}
            chartConfig={{
              backgroundGradientFrom: "#f0f2f5",
              backgroundGradientTo: "#f0f2f5",
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(30, 136, 229, ${opacity})`,
              labelColor: () => "#000",
              style: { borderRadius: 12 },
            }}
            style={{ marginVertical: 16, borderRadius: 12 }}
          />
        </>
      )}

      {/* Monthly Submission Trend */}
      {Object.keys(monthlyData).length > 0 && (
        <>
          <Text style={styles.chartTitle}>Monthly Submission Trend</Text>
          <LineChart
            data={monthlyChartData}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              backgroundGradientFrom: "#f0f2f5",
              backgroundGradientTo: "#f0f2f5",
              decimalPlaces: 0,
              color: () => "#1E88E5",
              labelColor: () => "#000",
              style: { borderRadius: 12 },
            }}
            bezier
            style={{ marginVertical: 16, borderRadius: 12 }}
          />
        </>
      )}

      {/* Data Quality Alert */}
      {summary.total > 0 && (summary.avgPh === 0 && summary.avgTurbidity === 0) && (
        <View style={styles.alertContainer}>
          <Text style={styles.alertTitle}>⚠️ Data Quality Notice</Text>
          <Text style={styles.alertText}>
            Some water quality parameters appear to be missing or zero. 
            Please verify data collection processes to ensure accurate measurements.
          </Text>
        </View>
      )}

      <View style={styles.recentContainer}>
  <Text style={styles.sectionTitle}>Recent Water Entries</Text>
  {waterData
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // newest first
    .slice(0, 3) // take only the first 3 entries
    .map((entry, index) => (
      <View key={index} style={styles.recentEntry}>
        <Text style={styles.entryText}>
          <Text style={styles.entryLabel}>pH: </Text>{entry.ph || 'N/A'}
        </Text>
        <Text style={styles.entryText}>
          <Text style={styles.entryLabel}>Turbidity: </Text>{entry.turbidity || 'N/A'}
        </Text>
        <Text style={styles.entryText}>
          <Text style={styles.entryLabel}>Temperature: </Text>{entry.temperature ? `${entry.temperature}°C` : 'N/A'}
        </Text>
        <Text style={styles.entryText}>
          <Text style={styles.entryLabel}>Chlorine: </Text>{entry.chlorine || 'N/A'}
        </Text>
        <Text style={styles.entryText}>
          <Text style={styles.entryLabel}>Dissolved Oxygen: </Text>{entry.dissolvedOxygen || 'N/A'}
        </Text>
        <Text style={styles.entryText}>
          <Text style={styles.entryLabel}>TDS: </Text>{entry.tds || 'N/A'}
        </Text>
        <Text style={styles.entryText}>
          <Text style={styles.entryLabel}>Source Type: </Text>{entry.waterSourceType?.replace('_', ' ') || 'Unknown'}
        </Text>
      </View>
    ))
  }
</View>

    </ScrollView>
  );
}

// -------------------------
// Profile Dashboard Component
// -------------------------
function ProfileDashboard() {
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalHealthSubmissions: 0,
    totalWaterSubmissions: 0,
    lastSyncTime: null as string | null
  });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    setIsLoading(true);
    try {
      const [healthResponse, waterResponse] = await Promise.all([
        fetch(`${BASE_URL}/health`),
        fetch(`${BASE_URL}/water`)
      ]);

      if (!healthResponse.ok || !waterResponse.ok) {
        throw new Error("Failed to fetch data from server");
      }

      const healthData = await healthResponse.json();
      const waterData = await waterResponse.json();

      // Calculate unique users based on houseId from health data
      const uniqueHouseIds = [...new Set(
        healthData
          .map((record: any) => record.houseId)
          .filter((id: any) => id && id.trim() !== "")
      )];

      setSystemStats({
        totalUsers: uniqueHouseIds.length,
        totalHealthSubmissions: healthData.length,
        totalWaterSubmissions: waterData.length,
        lastSyncTime: new Date().toLocaleString()
      });

    } catch (err) {
      console.error("Error fetching system stats:", err);
      Alert.alert("Error", "Failed to load system statistics");
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = (type: string) => {
    Alert.alert(
      "Export Data",
      `Export ${type} data functionality would be implemented here. This could generate CSV/Excel files or send data to external systems.`,
      [{ text: "OK" }]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading system statistics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll}>
      <Text style={styles.dashboardTitle}>Government Dashboard - System Overview</Text>

      {/* System Statistics Cards */}
      <View style={styles.cardsContainer}>
        <View style={[styles.card, styles.gradientGreen]}>
          <Text style={styles.cardTitle}>Registered Households</Text>
          <Text style={styles.cardValue}>{systemStats.totalUsers}</Text>
        </View>
        
        <View style={[styles.card, styles.gradientBlue]}>
          <Text style={styles.cardTitle}>Health Submissions</Text>
          <Text style={styles.cardValue}>{systemStats.totalHealthSubmissions}</Text>
        </View>
      </View>

      <View style={styles.cardsContainer}>
        <View style={[styles.card, styles.gradientOrange]}>
          <Text style={styles.cardTitle}>Water Quality Reports</Text>
          <Text style={styles.cardValue}>{systemStats.totalWaterSubmissions}</Text>
        </View>
        
        <View style={[styles.card, styles.gradientPurple]}>
          <Text style={styles.cardTitle}>Last Updated</Text>
          <Text style={styles.cardValueSmall}>{systemStats.lastSyncTime}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <Text style={styles.sectionTitle}>System Actions</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={fetchSystemStats}>
          <Text style={styles.actionButtonText}>🔄 Refresh Statistics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.exportButton]} 
          onPress={() => exportData('health')}
        >
          <Text style={styles.actionButtonText}>📊 Export Health Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.exportButton]} 
          onPress={() => exportData('water')}
        >
          <Text style={styles.actionButtonText}>💧 Export Water Data</Text>
        </TouchableOpacity>
      </View>

      {/* System Information */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>System Information</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dashboard Version:</Text>
          <Text style={styles.infoValue}>v1.0.0</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Database Status:</Text>
          <Text style={[styles.infoValue, styles.statusOnline]}>● Online</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Data Coverage:</Text>
          <Text style={styles.infoValue}>Northeast India</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Monitoring Areas:</Text>
          <Text style={styles.infoValue}>Health & Water Quality</Text>
        </View>
      </View>

      {/* Quick Links */}
      <View style={styles.linksSection}>
        <Text style={styles.sectionTitle}>Quick Links</Text>
        
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => Alert.alert("Feature", "Report generation feature would be implemented here")}
        >
          <Text style={styles.linkText}>📋 Generate Reports</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => Alert.alert("Feature", "System settings would be implemented here")}
        >
          <Text style={styles.linkText}>⚙️ System Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => Alert.alert("Feature", "User management interface would be implemented here")}
        >
          <Text style={styles.linkText}>👥 User Management</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => Alert.alert("Contact", "Support: admin@healthwater.gov.in\nPhone: +91-XXXX-XXXX")}
        >
          <Text style={styles.linkText}>📞 Support Contact</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// -------------------------
// Styles
// -------------------------
const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f0f2f5",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  refreshButton: {
    backgroundColor: "#1E90FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 80,
  },
  cardTitle: {
    fontSize: 12,
    color: "#fff",
    marginBottom: 8,
    fontWeight: "600",
    textAlign: "center",
  },
  cardValue: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
  },
  cardValueSmall: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
  gradient1: { backgroundColor: "#1E90FF" },
  gradient2: { backgroundColor: "#FFA500" },
  gradient3: { backgroundColor: "#E53935" },
  gradient4: { backgroundColor: "#4CAF50" },
  gradientBlue: { backgroundColor: "#1E90FF" },
  gradientGreen: { backgroundColor: "#4CAF50" },
  gradientOrange: { backgroundColor: "#FFA500" },
  gradientPurple: { backgroundColor: "#9C27B0" },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 8,
    color: "#333",
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1E90FF",
    paddingVertical: 12,
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  navText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  activeNavButton: {
    borderBottomWidth: 3,
    borderBottomColor: "#FFD700",
  },
  activeNavText: {
    fontWeight: "700",
  },
  actionSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: "#1E90FF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  exportButton: {
    backgroundColor: "#FF6B35",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  statusOnline: {
    color: "#4CAF50",
  },
  linksSection: {
    marginBottom: 40,
  },
  linkButton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  linkText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    marginRight: 5,
  },
  legendText: {
    fontSize: 12,
    color: "#333",
  },
  alertContainer: {
    backgroundColor: "#FFF3CD",
    borderColor: "#FFC107",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#856404",
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: "#856404",
    lineHeight: 20,
  },
    recentContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  recentCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentText: {
    fontSize: 14,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  recentEntry: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entryText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  entryLabel: {
    fontWeight: '600',
    color: '#000',
  }
});