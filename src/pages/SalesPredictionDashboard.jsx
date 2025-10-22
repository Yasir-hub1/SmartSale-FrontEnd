import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useNotification } from '../components/common/NotificationSystem';
import { mlService } from '../services/api';
import './SalesPredictionDashboard.css';

const SalesPredictionDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [trainingModel, setTrainingModel] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [productAnalysis, setProductAnalysis] = useState([]);
  const [clientAnalysis, setClientAnalysis] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  const [filters, setFilters] = useState({
    daysBack: 365,
    groupBy: 'day',
    daysAhead: 30
  });
  
  const { success, error } = useNotification();


  useEffect(() => {
    loadDashboardData();
  }, [filters.daysBack, filters.groupBy]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadHistoricalData(),
        loadProductAnalysis(),
        loadClientAnalysis(),
        loadModelInfo()
      ]);
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
      error('Error cargando datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadHistoricalData = async () => {
    try {
      const response = await mlService.getHistoricalData({
        days_back: filters.daysBack,
        group_by: filters.groupBy
      });
      setHistoricalData(response.data || []);
    } catch (error) {
      console.error('Error cargando datos históricos:', error);
    }
  };

  const loadProductAnalysis = async () => {
    try {
      const response = await mlService.getProductAnalysis({
        days_back: 90,
        limit: 10
      });
      setProductAnalysis(response.data || []);
    } catch (error) {
      console.error('Error cargando análisis de productos:', error);
    }
  };

  const loadClientAnalysis = async () => {
    try {
      const response = await mlService.getClientAnalysis({
        days_back: 90,
        limit: 10
      });
      setClientAnalysis(response.data || []);
    } catch (error) {
      console.error('Error cargando análisis de clientes:', error);
    }
  };

  const loadModelInfo = async () => {
    try {
      const response = await mlService.getModelInfo();
      setModelInfo(response);
    } catch (error) {
      console.error('Error cargando información del modelo:', error);
    }
  };

  const trainModel = async () => {
    setTrainingModel(true);
    try {
      const response = await mlService.trainSalesForecast({
        use_synthetic: true
      });
      
      if (response.success) {
        success('Modelo entrenado exitosamente');
        await loadModelInfo();
        await generatePredictions();
      } else {
        error(`Error entrenando modelo: ${response.error}`);
      }
    } catch (error) {
      console.error('Error entrenando modelo:', error);
      error('Error entrenando modelo');
    } finally {
      setTrainingModel(false);
    }
  };

  const generatePredictions = async () => {
    try {
      const response = await mlService.generatePrediction({
        days_ahead: filters.daysAhead
      });
      
      if (response.success) {
        setPredictions(response.predictions || []);
        success('Predicciones generadas exitosamente');
      } else {
        error(`Error generando predicciones: ${response.error}`);
      }
    } catch (error) {
      console.error('Error generando predicciones:', error);
      error('Error generando predicciones');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Preparar datos combinados para la gráfica principal
  const getCombinedChartData = () => {
    const combined = [];
    
    // Agregar datos históricos
    historicalData.forEach(item => {
      combined.push({
        date: item.date,
        historical: item.total_sales,
        transactions: item.num_transactions,
        avgTransaction: item.avg_transaction,
        type: 'historical'
      });
    });
    
    // Agregar predicciones
    predictions.forEach(item => {
      combined.push({
        date: item.date,
        predicted: item.predicted_sales,
        confidenceLower: item.confidence_lower,
        confidenceUpper: item.confidence_upper,
        type: 'prediction'
      });
    });
    
    return combined.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <LoadingSpinner size="large" />
        <p>Cargando dashboard de predicciones...</p>
      </div>
    );
  }

  return (
    <div className="sales-prediction-dashboard">
      <div className="dashboard-header">
        <h1>Dashboard de Predicción de Ventas</h1>
        <div className="dashboard-controls">
          <Select
            value={filters.daysBack}
            onChange={(e) => handleFilterChange('daysBack', parseInt(e.target.value))}
            options={[
              { value: 30, label: 'Últimos 30 días' },
              { value: 90, label: 'Últimos 90 días' },
              { value: 365, label: 'Último año' }
            ]}
          />
          <Select
            value={filters.groupBy}
            onChange={(e) => handleFilterChange('groupBy', e.target.value)}
            options={[
              { value: 'day', label: 'Por día' },
              { value: 'week', label: 'Por semana' },
              { value: 'month', label: 'Por mes' }
            ]}
          />
          <Button
            onClick={trainModel}
            disabled={trainingModel}
            variant="primary"
          >
            {trainingModel ? 'Entrenando...' : 'Entrenar Modelo'}
          </Button>
          <Button
            onClick={generatePredictions}
            variant="secondary"
          >
            Generar Predicciones
          </Button>
        </div>
      </div>

      {/* Información del Modelo */}
      {modelInfo && (
        <Card className="model-info-card">
          <CardHeader>
            <CardTitle>Información del Modelo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="model-metrics">
              <div className="metric">
                <span className="metric-label">Precisión (R²):</span>
                <span className="metric-value">
                  {modelInfo.model?.r2_score ? (modelInfo.model.r2_score * 100).toFixed(1) + '%' : 'N/A'}
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">MAE:</span>
                <span className="metric-value">
                  {modelInfo.model?.mae ? formatCurrency(modelInfo.model.mae) : 'N/A'}
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">RMSE:</span>
                <span className="metric-value">
                  {modelInfo.model?.rmse ? formatCurrency(modelInfo.model.rmse) : 'N/A'}
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Último Entrenamiento:</span>
                <span className="metric-value">
                  {modelInfo.model?.last_retrain ? 
                    new Date(modelInfo.model.last_retrain).toLocaleDateString('es-MX') : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfica Principal - Ventas Históricas vs Predicciones */}
      <Card className="main-chart-card">
        <CardHeader>
          <CardTitle>Ventas Históricas vs Predicciones</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={getCombinedChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value, name) => [
                  formatCurrency(value), 
                  name === 'historical' ? 'Histórico' : 
                  name === 'predicted' ? 'Predicción' : name
                ]}
                labelFormatter={(label) => formatDate(label)}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="historical" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Ventas Históricas"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#82ca9d" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Predicciones"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="dashboard-grid">
        {/* Análisis de Productos */}
        <Card className="analysis-card">
          <CardHeader>
            <CardTitle>Top Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productAnalysis.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="product__name" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Ingresos']} />
                <Bar dataKey="total_revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Análisis de Clientes */}
        <Card className="analysis-card">
          <CardHeader>
            <CardTitle>Top Clientes por Compras</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={clientAnalysis.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="client__name" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Total Gastado']} />
                <Bar dataKey="total_spent" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Distribución de Transacciones */}
      <Card className="transactions-card">
        <CardHeader>
          <CardTitle>Distribución de Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  value, 
                  name === 'num_transactions' ? 'Transacciones' : name
                ]}
                labelFormatter={(label) => formatDate(label)}
              />
              <Area 
                type="monotone" 
                dataKey="num_transactions" 
                stroke="#8884d8" 
                fill="#8884d8"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Predicciones Detalladas */}
      {predictions.length > 0 && (
        <Card className="predictions-card">
          <CardHeader>
            <CardTitle>Predicciones Detalladas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="predictions-table">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Ventas Predichas</th>
                    <th>Intervalo de Confianza</th>
                    <th>Día de la Semana</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.slice(0, 10).map((prediction, index) => (
                    <tr key={index}>
                      <td>{formatDate(prediction.date)}</td>
                      <td>{formatCurrency(prediction.predicted_sales)}</td>
                      <td>
                        {formatCurrency(prediction.confidence_lower)} - {formatCurrency(prediction.confidence_upper)}
                      </td>
                      <td>
                        {new Date(prediction.date).toLocaleDateString('es-MX', { weekday: 'long' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SalesPredictionDashboard;
