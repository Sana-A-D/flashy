import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { HomeScreen } from '../../features/home/HomeScreen';
import { ScanScreen } from '../../features/scan/ScanScreen';
import { FashionAnalysisScreen } from '../../features/fashion/FashionAnalysisScreen';
import { SavedScreen } from '../../features/saved/SavedScreen';
import { ExploreScreen } from '../../features/explore/ExploreScreen';
import { ProfileScreen } from '../../features/profile/ProfileScreen';
import { DashboardScreen } from '../../features/dashboard/DashboardScreen';
import { LoginScreen } from '../../features/auth/screens/LoginScreen';
import { RegisterScreen } from '../../features/auth/screens/RegisterScreen';
import { InventoryScreen } from '../../features/inventory/InventoryScreen';
import { AddItemScreen } from '../../features/inventory/AddItemScreen';
import { ItemDetailScreen } from '../../features/inventory/ItemDetailScreen';
import { ListingEditorScreen } from '../../features/inventory/ListingEditorScreen';
import { RecordSaleScreen } from '../../features/sales/RecordSaleScreen';
import { AnalyticsScreen } from '../../features/analytics/AnalyticsScreen';
import { EbaySettingsScreen } from '../../features/settings/EbaySettingsScreen';
import { ProgressScreen } from '../../features/dashboard/ProgressScreen';
import { ItemHistoryScreen } from '../../features/inventory/ItemHistoryScreen';
import { StorageLocationsScreen } from '../../features/inventory/StorageLocationsScreen';
import { MarketplacesScreen } from '../../features/marketplaces/MarketplacesScreen';
import { SubscriptionScreen } from '../../features/subscription/SubscriptionScreen';
import { AdminDashboardScreen } from '../../features/admin/AdminDashboardScreen';
import { DataPrivacyScreen } from '../../features/settings/DataPrivacyScreen';
import { SettingsScreen } from '../../features/settings/SettingsScreen';
import { useAuthStore } from '../../features/auth/store/useAuthStore';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { isAuthenticated, isHydrating, initialize } = useAuthStore();

  useEffect(() => {
    console.log("RootNavigator mounted, initializing auth state...");
    initialize();
  }, []);

  useEffect(() => {
    console.log("Auth state changed - isAuthenticated:", isAuthenticated);
  }, [isAuthenticated]);

  if (isHydrating) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            {/* Primary Flashy Consumer Navigation */}
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ title: 'Flashy', headerShown: false }} 
            />
            <Stack.Screen 
              name="Explore" 
              component={ExploreScreen} 
              options={{ title: 'Explore' }} 
            />
            <Stack.Screen 
              name="Scan" 
              component={ScanScreen} 
              options={{ presentation: 'modal' }} 
            />
            <Stack.Screen 
              name="Saved" 
              component={SavedScreen} 
              options={{ title: 'Saved' }} 
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen} 
              options={{ title: 'Profile' }} 
            />
            <Stack.Screen 
              name="FashionAnalysis" 
              component={FashionAnalysisScreen} 
              options={{ title: 'Fashion Report' }} 
            />

            {/* Repurposed/Internal Secondary Screens */}
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen} 
              options={{ title: 'Workspace', headerShown: false }} 
            />
            <Stack.Screen 
              name="Inventory" 
              component={InventoryScreen} 
              options={{ title: 'Inventory', headerShown: false }} 
            />
            <Stack.Screen 
              name="AddItem" 
              component={AddItemScreen} 
              options={{ presentation: 'modal' }} 
            />
            <Stack.Screen 
              name="ItemDetail" 
              component={ItemDetailScreen} 
            />
            <Stack.Screen 
              name="ItemHistory" 
              component={ItemHistoryScreen} 
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen 
              name="StorageLocations" 
              component={StorageLocationsScreen} 
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="ListingEditor"
              component={ListingEditorScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="RecordSale"
              component={RecordSaleScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="Analytics"
              component={AnalyticsScreen}
              options={{ title: 'Analytics & Profit' }}
            />
            <Stack.Screen
              name="EbaySettings"
              component={EbaySettingsScreen}
              options={{ title: 'eBay Integration' }}
            />
            <Stack.Screen
              name="Marketplaces"
              component={MarketplacesScreen}
              options={{ title: 'Marketplaces' }}
            />
            <Stack.Screen
              name="Subscription"
              component={SubscriptionScreen}
              options={{ title: 'Subscription & Billing' }}
            />
            <Stack.Screen
              name="AdminDashboard"
              component={AdminDashboardScreen}
              options={{ title: 'Admin Control Center' }}
            />
            <Stack.Screen
              name="DataPrivacy"
              component={DataPrivacyScreen}
              options={{ title: 'Data & Privacy' }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: 'Settings' }}
            />
            <Stack.Screen
              name="Progress"
              component={ProgressScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
