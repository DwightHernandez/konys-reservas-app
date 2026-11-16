import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../constants/theme';

export default function AppFooter() {
  const colors = useAppTheme();

  return (
    <View style={[styles.container, { borderTopColor: colors.line }]}>
      <Text style={[styles.credit, { color: colors.muted }]}>
        Diseñado y desarrollado por Dwight Hernandez
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 18,
    paddingTop: 12,
    paddingBottom: 6,
  },
  credit: {
    fontSize: 10,
    textAlign: 'center',
  },
});
