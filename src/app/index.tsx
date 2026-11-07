import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import colors from '../constants/colors';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Encabezado */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>KONYS PIZZA</Text>
            <Text style={styles.subtitle}>
              El sabor que reúne
            </Text>
          </View>

          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🍕</Text>
          </View>
        </View>

        {/* Presentación principal */}
        <View style={styles.hero}>
          <Text style={styles.heroTag}>
            HECHO PARA DISFRUTAR
          </Text>

          <Text style={styles.heroTitle}>
            Una buena pizza,{'\n'}
            un gran momento.
          </Text>

          <Text style={styles.heroDescription}>
            Comparte algo delicioso con las personas
            que más quieres.
          </Text>

          <View style={styles.pizzaIllustration}>
            <Text style={styles.pizzaEmoji}>🍕</Text>
            <Text style={styles.pizzaCaption}>
              El auténtico sabor de Konys
            </Text>
          </View>

          <Pressable
            style={styles.reserveButton}
            onPress={() => router.push('/reservar')}
          >
            <Text style={styles.reserveButtonText}>
              Reservar una mesa
            </Text>
            <Text style={styles.buttonArrow}>→</Text>
          </Pressable>
        </View>

        {/* Categorías */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ¿Qué se te antoja hoy?
          </Text>

          <View style={styles.categories}>
            <View style={styles.categoryCard}>
              <Text style={styles.categoryEmoji}>🍕</Text>
              <Text style={styles.categoryName}>Pizzas</Text>
            </View>

            <View style={styles.categoryCard}>
              <Text style={styles.categoryEmoji}>🍟</Text>
              <Text style={styles.categoryName}>Entradas</Text>
            </View>

            <View style={styles.categoryCard}>
              <Text style={styles.categoryEmoji}>🍰</Text>
              <Text style={styles.categoryName}>Postres</Text>
            </View>

            <View style={styles.categoryCard}>
              <Text style={styles.categoryEmoji}>🥤</Text>
              <Text style={styles.categoryName}>Bebidas</Text>
            </View>
          </View>
        </View>

        {/* Información inferior */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            ¡Te esperamos!
          </Text>

          <Text style={styles.infoDescription}>
            Reserva tu mesa y disfruta de una
            experiencia deliciosa en Konys Pizza.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  logo: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.secondary,
    letterSpacing: 1,
  },

  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },

  logoIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#FFE8CE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoEmoji: {
    fontSize: 25,
  },

  hero: {
    marginHorizontal: 18,
    padding: 22,
    borderRadius: 28,
    backgroundColor: '#FFF0DE',
  },

  heroTag: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  heroTitle: {
    fontSize: 31,
    fontWeight: '900',
    color: colors.text,
    marginTop: 14,
    lineHeight: 38,
  },

  heroDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginTop: 10,
  },

  pizzaIllustration: {
    height: 190,
    backgroundColor: '#FFDDB8',
    borderRadius: 22,
    marginTop: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pizzaEmoji: {
    fontSize: 100,
  },

  pizzaCaption: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 5,
  },

  reserveButton: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 20,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  reserveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  buttonArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    marginLeft: 10,
  },

  section: {
    paddingHorizontal: 22,
    marginTop: 30,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 16,
  },

  categories: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  categoryCard: {
    width: '23%',
    backgroundColor: colors.surface,
    borderRadius: 17,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  categoryEmoji: {
    fontSize: 27,
  },

  categoryName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },

  infoCard: {
    marginHorizontal: 22,
    marginTop: 28,
    marginBottom: 30,
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  infoTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.text,
  },

  infoDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: 7,
  },
});