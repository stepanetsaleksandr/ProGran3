import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ProGran3 Tracking Server',
  description: 'Server for tracking ProGran3 plugin activity',
};

export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: '#1f2937', 
            margin: '0 0 10px 0' 
          }}>
            ProGran3 Tracking Server
          </h1>
          <p style={{ color: '#6b7280', fontSize: '18px', margin: '0' }}>
            Моніторинг активності плагінів ProGran3
          </p>
        </div>
        
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{ marginRight: '12px' }}>
              <div style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#22c55e',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
              </div>
            </div>
            <div>
              <p style={{ 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#166534',
                margin: '0'
              }}>
                Сервер працює успішно!
              </p>
            </div>
          </div>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h3 style={{ 
              fontWeight: '600', 
              color: '#1e40af', 
              margin: '0 0 15px 0',
              fontSize: '16px'
            }}>
              API Endpoints
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{
                  fontFamily: 'monospace',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  POST /api/heartbeat
                </span>
                <span style={{ color: '#1e40af', marginLeft: '8px', fontSize: '14px' }}>
                  Відстеження активності
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{
                  fontFamily: 'monospace',
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  GET /api/plugins
                </span>
                <span style={{ color: '#166534', marginLeft: '8px', fontSize: '14px' }}>
                  Статистика плагінів
                </span>
              </div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#faf5ff',
            border: '1px solid #d8b4fe',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h3 style={{ 
              fontWeight: '600', 
              color: '#7c3aed', 
              margin: '0 0 15px 0',
              fontSize: '16px'
            }}>
              Швидкі дії
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a 
                href="/dashboard" 
                style={{
                  display: 'block',
                  width: '100%',
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  textAlign: 'center',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Перейти до Dashboard
              </a>
              <a 
                href="/api/plugins" 
                target="_blank"
                style={{
                  display: 'block',
                  width: '100%',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  textAlign: 'center',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Перевірити API
              </a>
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <p style={{ 
            fontSize: '12px', 
            color: '#9ca3af',
            margin: '0'
          }}>
            Побудовано з Next.js 14 + TypeScript + Supabase
          </p>
        </div>
      </div>
    </div>
  );
}
