import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer'
import type { Driver, PayrollSnapshot } from './types'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  companyName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#1d4ed8' },
  subtitle: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  period: { fontSize: 10, color: '#6b7280', textAlign: 'right', marginTop: 2 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginVertical: 16 },
  driverBox: { backgroundColor: '#f9fafb', borderRadius: 6, padding: 12, marginBottom: 16 },
  driverName: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
  driverPhone: { fontSize: 9, color: '#6b7280', marginTop: 2 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { color: '#374151' },
  rowValue: { fontFamily: 'Helvetica-Bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, backgroundColor: '#1d4ed8', paddingHorizontal: 10, borderRadius: 6, marginTop: 8 },
  totalLabel: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 12 },
  totalValue: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 14 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#9ca3af' },
})

function rm(n: number) {
  return `RM ${n.toFixed(2)}`
}

function PayslipDoc({ driver, snapshot }: { driver: Driver; snapshot: PayrollSnapshot }) {
  const period = `${MONTHS[snapshot.month - 1]} ${snapshot.year}`
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>Driver Payroll</Text>
            <Text style={styles.subtitle}>Logistics Management System</Text>
          </View>
          <View>
            <Text style={styles.title}>PAYSLIP</Text>
            <Text style={styles.period}>{period}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.driverBox}>
          <Text style={styles.driverName}>{driver.name}</Text>
          <Text style={styles.driverPhone}>{driver.phone}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance Summary</Text>
          <View style={styles.row}><Text style={styles.rowLabel}>Days Worked</Text><Text style={styles.rowValue}>{snapshot.days_worked} days</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Total Hours</Text><Text style={styles.rowValue}>{snapshot.total_hours.toFixed(1)} hrs</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Overtime Hours (beyond 40h/week)</Text><Text style={styles.rowValue}>{snapshot.ot_hours.toFixed(1)} hrs</Text></View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings</Text>
          <View style={styles.row}><Text style={styles.rowLabel}>Base Salary</Text><Text style={styles.rowValue}>{rm(snapshot.base_salary)}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Overtime Pay ({snapshot.ot_hours.toFixed(1)}h × RM {driver.ot_rate}/hr)</Text><Text style={styles.rowValue}>{rm(snapshot.ot_pay)}</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allowances</Text>
          <View style={styles.row}><Text style={styles.rowLabel}>Meal Allowance</Text><Text style={styles.rowValue}>{rm(snapshot.meal_total)}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Toll / Parking</Text><Text style={styles.rowValue}>{rm(snapshot.toll_total)}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Dental Benefit</Text><Text style={styles.rowValue}>{rm(snapshot.dental_allowance)}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Medical Benefit</Text><Text style={styles.rowValue}>{rm(snapshot.medical_allowance)}</Text></View>
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>GROSS PAY</Text>
          <Text style={styles.totalValue}>{rm(snapshot.gross_pay)}</Text>
        </View>

        <Text style={styles.footer}>Generated on {new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })} · Driver Payroll System</Text>
      </Page>
    </Document>
  )
}

export async function generatePayslipPDF(driver: Driver, snapshot: PayrollSnapshot): Promise<Buffer> {
  return renderToBuffer(<PayslipDoc driver={driver} snapshot={snapshot} />)
}
