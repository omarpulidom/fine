import { Redirect, Tabs } from "expo-router";
import { TabBar } from "@/components/Elements/TabBar";
import { Header } from "@/components/Elements/Header";
import { useAuth } from "@/components/Providers/AuthProvider";

export default function TabsLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: true,
        header: () => <Header />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Profile",
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
        }}
      />
      <Tabs.Screen
        name="savings"
        options={{
          title: "Savings",
        }}
      />
      <Tabs.Screen
        name="debts"
        options={{
          title: "Debts",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
