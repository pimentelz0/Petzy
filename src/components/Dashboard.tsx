/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  PawPrint, Calendar, Activity, Plus, FileText, Sparkles, 
  Trash2, Scale, Heart, AlertTriangle, ChevronRight, User, Info, CheckCircle, Clock
} from 'lucide-react';
import { 
  Pet, Vaccine, Appointment, Medication, WeightRecord, HealthyRecipe 
} from '../types';
import { 
  getPets, createPet, deletePet,
  getVaccines, createVaccine, deleteVaccine,
  getAppointments, createAppointment, deleteAppointment,
  getMedications, createMedication, deleteMedication,
  getWeights, createWeight, deleteWeight
} from '../lib/supabase';
import { 
  getRecipesByAnimal, addRecipeToDb, isDatabaseSeeded, seedRecipes, Recipe as DbRecipe
} from '../lib/recipeDb';

interface DashboardProps {
  userId: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setAlertCount: (count: number) => void;
}

export default function Dashboard({ userId, activeTab, setActiveTab, setAlertCount }: DashboardProps) {
  // Database States
  const [pets, setPets] = useState<Pet[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [weights, setWeights] = useState<WeightRecord[]>([]);

  // Selected Pet for detail views
  const [selectedPetId, setSelectedPetId] = useState<string>('');

  // UI States & Form states
  const [isAddingPet, setIsAddingPet] = useState(false);
  const [isAddingVaccine, setIsAddingVaccine] = useState(false);
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);
  const [isAddingMed, setIsAddingMed] = useState(false);
  const [isAddingWeight, setIsAddingWeight] = useState(false);

  // loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // New Pet Form
  const [newPetName, setNewPetName] = useState('');
  const [newPetType, setNewPetType] = useState('Cachorro');
  const [newPetBreed, setNewPetBreed] = useState('');
  const [newPetBirth, setNewPetBirth] = useState('');
  const [newPetPhoto, setNewPetPhoto] = useState('');

  // New Vaccine Form
  const [newVacName, setNewVacName] = useState('');
  const [newVacPet, setNewVacPet] = useState('');
  const [newVacDate, setNewVacDate] = useState('');
  const [newVacNext, setNewVacNext] = useState('');

  // New Appointment Form
  const [newAppPet, setNewAppPet] = useState('');
  const [newAppVet, setNewAppVet] = useState('');
  const [newAppDate, setNewAppDate] = useState('');
  const [newAppTime, setNewAppTime] = useState('14:00');
  const [newAppReason, setNewAppReason] = useState('');
  const [newAppObs, setNewAppObs] = useState('');

  // New Medication Form
  const [newMedPet, setNewMedPet] = useState('');
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedFreq, setNewMedFreq] = useState('12h');
  const [newMedStart, setNewMedStart] = useState('');
  const [newMedEnd, setNewMedEnd] = useState('');

  // New Weight Form
  const [newWeightPet, setNewWeightPet] = useState('');
  const [newWeightValue, setNewWeightValue] = useState('');
  const [newWeightDate, setNewWeightDate] = useState('');

  // AI Recipe states
  const [aiPetType, setAiPetType] = useState('dog');
  const [customPetType, setCustomPetType] = useState('');
  const [aiRecipe, setAiRecipe] = useState<HealthyRecipe | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);

  // New recipes DB states
  const [recipesList, setRecipesList] = useState<DbRecipe[]>([]);
  const [selectedAnimalFilter, setSelectedAnimalFilter] = useState('Cachorro'); // Default: Cachorro
  const [selectedDbRecipe, setSelectedDbRecipe] = useState<DbRecipe | null>(null);
  const [isSeeded, setIsSeeded] = useState(true); // Checked in useEffect
  const [seedingLoading, setSeedingLoading] = useState(false);

  // Load all user records initially
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const fetchedPets = await getPets(userId);
        setPets(fetchedPets);
        if (fetchedPets.length > 0) {
          setSelectedPetId(fetchedPets[0].id);
        }

        const fetchedVac = await getVaccines(userId);
        setVaccines(fetchedVac);

        const fetchedApp = await getAppointments(userId);
        setAppointments(fetchedApp);

        const fetchedMed = await getMedications(userId);
        setMedications(fetchedMed);

        const fetchedWei = await getWeights(userId);
        setWeights(fetchedWei);
      } catch (err) {
        console.error('Error fetching data from Supabase/cache:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [userId]);

  // Check seeding status and load recipes whenever selected animal filter changes
  useEffect(() => {
    async function loadRecipes() {
      const seeded = await isDatabaseSeeded();
      setIsSeeded(seeded);
      try {
        const list = await getRecipesByAnimal(selectedAnimalFilter);
        setRecipesList(list);
      } catch (e) {
        console.error('Failed to load recipes for', selectedAnimalFilter, e);
      }
    }
    loadRecipes();
  }, [selectedAnimalFilter]);

  // Compute Upcoming Alarms/Alerts (next dose / appointment soon)
  const getAlerts = () => {
    const alerts: Array<{
      id: string;
      petName: string;
      petPhoto?: string;
      type: 'vaccine' | 'appointment' | 'medication';
      title: string;
      date: string;
      daysRemaining: number;
    }> = [];

    const today = new Date();

    // Check vaccines due inside 30 days
    vaccines.forEach(vac => {
      const dueDate = new Date(vac.next_dose_date);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= -7 && diffDays <= 30) {
        const petObj = pets.find(p => p.id === vac.pet_id);
        alerts.push({
          id: vac.id,
          petName: petObj ? petObj.name : 'Pet',
          petPhoto: petObj?.photo_url,
          type: 'vaccine',
          title: `Próxima dose: ${vac.name}`,
          date: vac.next_dose_date,
          daysRemaining: diffDays
        });
      }
    });

    // Check future appointments inside 30 days or today
    appointments.forEach(app => {
      const appDate = new Date(app.date);
      const diffTime = appDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= -1 && diffDays <= 30) {
        const petObj = pets.find(p => p.id === app.pet_id);
        alerts.push({
          id: app.id,
          petName: petObj ? petObj.name : 'Pet',
          petPhoto: petObj?.photo_url,
          type: 'appointment',
          title: `Consulta com ${app.veterinarian} (${app.reason})`,
          date: app.date,
          daysRemaining: diffDays
        });
      }
    });

    // Sort by proximity
    alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return alerts;
  };

  const currentAlerts = getAlerts();

  // Sync alert count to Navbar
  useEffect(() => {
    setAlertCount(currentAlerts.length);
  }, [currentAlerts.length, setAlertCount]);

  // Calculate age of pet in human readable text
  const getPetAgeText = (birthDateString: string) => {
    if (!birthDateString) return '';
    const birth = new Date(birthDateString);
    const today = new Date();
    
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    
    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }

    if (years === 0) {
      return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    }
    return `${years} ${years === 1 ? 'ano' : 'anos'}${months > 0 ? ` e ${months} ${months === 1 ? 'mês' : 'meses'}` : ''}`;
  };

  // -------------------------------------------------------------
  // FORM SUBMIT HANDLERS
  // -------------------------------------------------------------

  const handleAddPetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetName || !newPetType) return;

    try {
      const pet = await createPet({
        name: newPetName,
        type: newPetType,
        breed: newPetBreed || 'SRD (Sem Raça Definida)',
        birth_date: newPetBirth || new Date().toISOString().split('T')[0],
        photo_url: newPetPhoto || undefined,
        user_id: userId
      });

      setPets(prev => [...prev, pet]);
      if (!selectedPetId) {
        setSelectedPetId(pet.id);
      }
      
      // Reset form
      setNewPetName('');
      setNewPetBreed('');
      setNewPetBirth('');
      setNewPetPhoto('');
      setIsAddingPet(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddVaccineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const petId = newVacPet || selectedPetId;
    if (!newVacName || !petId || !newVacDate || !newVacNext) return;

    try {
      const vac = await createVaccine({
        pet_id: petId,
        name: newVacName,
        date: newVacDate,
        next_dose_date: newVacNext,
        user_id: userId
      });

      setVaccines(prev => [...prev, vac]);
      setNewVacName('');
      setNewVacDate('');
      setNewVacNext('');
      setIsAddingVaccine(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const petId = newAppPet || selectedPetId;
    if (!petId || !newAppVet || !newAppDate || !newAppReason) return;

    try {
      const app = await createAppointment({
        pet_id: petId,
        date: newAppDate,
        time: newAppTime,
        veterinarian: newAppVet,
        reason: newAppReason,
        observations: newAppObs,
        user_id: userId
      });

      setAppointments(prev => [...prev, app]);
      setNewAppVet('');
      setNewAppDate('');
      setNewAppTime('14:00');
      setNewAppReason('');
      setNewAppObs('');
      setIsAddingAppointment(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMedicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const petId = newMedPet || selectedPetId;
    if (!petId || !newMedName || !newMedDose || !newMedStart || !newMedEnd) return;

    try {
      const med = await createMedication({
        pet_id: petId,
        name: newMedName,
        dose: newMedDose,
        frequency: newMedFreq,
        start_date: newMedStart,
        end_date: newMedEnd,
        user_id: userId
      });

      setMedications(prev => [...prev, med]);
      setNewMedName('');
      setNewMedDose('');
      setNewMedStart('');
      setNewMedEnd('');
      setIsAddingMed(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const petId = newWeightPet || selectedPetId;
    const value = parseFloat(newWeightValue);
    if (!petId || isNaN(value) || !newWeightDate) return;

    try {
      const weightRec = await createWeight({
        pet_id: petId,
        date: newWeightDate,
        weight: value,
        user_id: userId
      });

      setWeights(prev => {
        const updated = [...prev, weightRec];
        updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return updated;
      });
      setNewWeightValue('');
      setNewWeightDate('');
      setIsAddingWeight(false);
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------------
  // DELETE HANDLERS
  // -------------------------------------------------------------

  const handleDeletePetClick = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este pet? Todos os registros associados serão apagados.')) {
      try {
        await deletePet(id, userId);
        setPets(prev => prev.filter(p => p.id !== id));
        if (selectedPetId === id) {
          const remaining = pets.filter(p => p.id !== id);
          setSelectedPetId(remaining.length > 0 ? remaining[0].id : '');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteVaccineClick = async (vacId: string) => {
    try {
      await deleteVaccine(vacId, userId);
      setVaccines(prev => prev.filter(v => v.id !== vacId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAppClick = async (appId: string) => {
    try {
      await deleteAppointment(appId, userId);
      setAppointments(prev => prev.filter(a => a.id !== appId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMedClick = async (medId: string) => {
    try {
      await deleteMedication(medId, userId);
      setMedications(prev => prev.filter(m => m.id !== medId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWeightClick = async (wId: string) => {
    try {
      await deleteWeight(wId, userId);
      setWeights(prev => prev.filter(w => w.id !== wId));
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------------
  // AI RECIPES LOGIC & DB MANAGEMENT
  // -------------------------------------------------------------

  const handleExecuteSeed = async () => {
    setSeedingLoading(true);
    setRecipeError(null);
    try {
      await seedRecipes();
      setIsSeeded(true);
      // Reload the active list
      const list = await getRecipesByAnimal(selectedAnimalFilter);
      setRecipesList(list);
    } catch (err: any) {
      setRecipeError('Erro ao executar o seed inicial de receitas: ' + (err.message || err));
    } finally {
      setSeedingLoading(false);
    }
  };

  const generateRecipe = async () => {
    setRecipeLoading(true);
    setRecipeError(null);
    setAiRecipe(null);

    // Call API with the selected animal type filter on screen
    const finalType = selectedAnimalFilter;

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petType: finalType })
      });

      if (!response.ok) {
        throw new Error('Não foi possível se conectar ao servidor do Petzy.');
      }

      const data = await response.json();
      if (data.recipe) {
        // Save dynamically generated recipe to Firestore
        const returned = data.recipe;
        const saved = await addRecipeToDb({
          tipoAnimal: finalType,
          titulo: returned.titulo || returned.title || `Receita Especial IA de ${finalType}`,
          descricao: returned.descricao || returned.description || `Receita saborosa recomendada criada sob demanda pela inteligência artificial.`,
          ingredientes: returned.ingredientes || returned.ingredients || [],
          modoPreparo: returned.modoPreparo || (Array.isArray(returned.instructions) ? returned.instructions.join('\n') : (returned.instructions || '')),
          beneficios: returned.beneficios || returned.benefits || 'Rico em minerais saudáveis para equilibrar a dieta do animal.',
          criadoEm: new Date().toISOString(),
          geradaPorIA: true
        });

        // Pre-select for detail view:
        setSelectedDbRecipe(saved);
        // Reload list to update counters and grid
        const newList = await getRecipesByAnimal(finalType);
        setRecipesList(newList);
      } else {
        throw new Error('Falha ao parsear receita da Inteligência Artificial.');
      }
    } catch (err: any) {
      setRecipeError(err.message || 'Ocorreu um problema ao chamar a IA do Gemini.');
    } finally {
      setRecipeLoading(false);
    }
  };

  // -------------------------------------------------------------
  // CUSTOM SVG RESPONSIVE WEIGHT PLOTTER CHART
  // -------------------------------------------------------------
  const renderWeightChart = () => {
    const activePetWeights = weights
      .filter(w => w.pet_id === selectedPetId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (activePetWeights.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-[#E4E4E0] rounded-2xl p-6 text-[#1C1917]/50 text-center bg-[#FAFAF8]">
          <Scale className="w-8 h-8 mb-2 text-[#059669]/60" />
          <p className="text-sm font-semibold">Nenhum registro de peso cadastrado.</p>
          <p className="text-xs">Registre as pesagens bimestrais ou mensais de crescimento do seu pet para projetar no gráfico de evolução.</p>
        </div>
      );
    }

    // Chart constants for responsive canvas rendering
    const width = 500;
    const height = 180;
    const paddingX = 40;
    const paddingY = 25;

    const minWeight = Math.min(...activePetWeights.map(w => w.weight));
    const maxWeight = Math.max(...activePetWeights.map(w => w.weight));
    const weightRange = maxWeight - minWeight === 0 ? 5 : (maxWeight - minWeight);
    
    // Grid values mapping function
    const mapX = (index: number) => {
      if (activePetWeights.length <= 1) return width / 2;
      return paddingX + (index * (width - 2 * paddingX)) / (activePetWeights.length - 1);
    };

    const mapY = (weight: number) => {
      const stretch = height - 2 * paddingY;
      // High weight value gets low Y on computer screen axes
      if (weightRange === 0) return height / 2;
      return height - paddingY - ((weight - minWeight) * stretch) / weightRange;
    };

    // Construct the SVG polyline and circles
    let pointsStr = '';
    const items = activePetWeights.map((w, index) => {
      const cx = mapX(index);
      const cy = mapY(w.weight);
      pointsStr += `${cx},${cy} `;
      
      const formattedDate = new Date(w.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
      return { cx, cy, weight: w.weight, date: formattedDate, original: w };
    });

    return (
      <div className="bg-[#D1FAE5]/10 border border-[#D1FAE5] rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#059669]" />
            <h4 className="text-sm font-bold text-[#1C1917] uppercase tracking-wider">Evolução Física do Peso</h4>
          </div>
          <p className="text-xs font-semibold text-[#059669] bg-[#D1FAE5] px-2.5 py-1 rounded-full">
            Mín: {minWeight}kg / Máx: {maxWeight}kg
          </p>
        </div>

        <div className="relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            {/* Guide Grid Lines */}
            <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#E5E7EB" strokeDasharray="3,3" />
            <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="#E5E7EB" strokeDasharray="3,3" />
            <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#E5E7EB" strokeDasharray="3,3" />

            {/* Main Path Line */}
            {items.length > 1 && (
              <polyline
                fill="none"
                stroke="#059669"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsStr}
              />
            )}

            {/* Render circle nodes with visual interactive weight labels */}
            {items.map((node, idx) => (
              <g key={idx} className="group cursor-pointer">
                <circle
                  cx={node.cx}
                  cy={node.cy}
                  r="6.5"
                  fill="#F97316"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  className="transition-transform duration-200 hover:scale-150"
                />
                <text
                  x={node.cx}
                  y={node.cy - 12}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-[#1C1917]"
                >
                  {node.weight}kg
                </text>
                <text
                  x={node.cx}
                  y={height - 8}
                  textAnchor="middle"
                  className="text-[8px] font-medium fill-[#1C1917]/50"
                >
                  {node.date}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <p className="text-[11px] text-[#1C1917]/60 text-center mt-3 leading-relaxed">
          * Os pontos de dados no gráfico representam pesagens cadastradas em ordem cronológica. Passe o cursor ou aproxime para checar as datas correspondentes.
        </p>
      </div>
    );
  };

  // -------------------------------------------------------------
  // PANEL SUBVIEWS RENDERING
  // -------------------------------------------------------------

  const activePet = pets.find(p => p.id === selectedPetId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-8 space-y-8 animate-fade-in pb-16">
      
      {/* 1. WELCOME HERO SECTION */}
      <div className="bg-gradient-to-r from-[#D1FAE5] to-emerald-50 border border-[#D1FAE5] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 bg-[#059669] text-[#D1FAE5] text-xs font-semibold px-3 py-1 rounded-full tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>SaaS de Saúde Animal</span>
          </div>
          <h2 className="text-2xl md:text-3.5xl font-extrabold text-[#1C1917] tracking-tight">
            Seu Assistente de Prevenção Veterinária
          </h2>
          <p className="text-sm text-[#1C1917]/70 font-medium">
            Mantenha as vacinas em dia, organize receitas, medicação e controle de crescimento de todos os seus animais de estimação.
          </p>
        </div>

        {/* Action Button: Fast Registrations */}
        <div className="flex flex-wrap gap-2.5 justify-center">
          <button
            id="dash-add-pet-fast"
            onClick={() => setIsAddingPet(true)}
            className="bg-[#059669] hover:bg-[#047857] text-[#D1FAE5] font-bold px-4 py-2.5 rounded-2xl text-xs uppercase tracking-wider shadow-sm transition-all focus:outline-none flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Pet</span>
          </button>
          
          <button
            id="dash-fast-recipe"
            onClick={() => {
              setActiveTab('recipes');
              if (activePet) {
                setAiPetType(activePet.type.toLowerCase());
              }
            }}
            className="bg-[#F97316] hover:bg-[#EA580C] text-white font-bold px-4 py-2.5 rounded-2xl text-xs uppercase tracking-wider shadow-sm transition-all focus:outline-none flex items-center gap-1.5 animate-pulse"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>criar receita</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-[#059669] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-semibold text-[#1C1917]/60">Carregando dados do servidor...</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Main conditional flow depending on activeTab */}
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column (8 cols): Interactive Alerting + Next actions */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* Visual Alerts Grid */}
                <div className="bg-white border border-[#E4E4E0] rounded-3xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#1C1917] tracking-tight">Alertas de Vencimentos</h3>
                      <p className="text-xs text-[#1C1917]/60">Alerta visual automático para itens vencendo em até 30 dias.</p>
                    </div>
                    <span className="text-xs font-bold text-white bg-[#F97316] px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {currentAlerts.length} pendências
                    </span>
                  </div>

                  {currentAlerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 bg-[#FAFAF8] rounded-2xl p-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-[#059669]">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#1C1917]">Excelente! Tudo em ordem.</p>
                        <p className="text-xs text-[#1C1917]/60">Nenhuma vacina ou consulta marcada para os próximos 30 dias de todos os seus pets ativos.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {currentAlerts.map(alert => (
                        <div 
                          key={alert.id}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all hover:scale-[1.01] ${
                            alert.daysRemaining <= 5 
                              ? 'bg-red-50/50 border-red-200' 
                              : 'bg-orange-50/50 border-orange-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-[#F97316] overflow-hidden flex-shrink-0">
                              {alert.petPhoto ? (
                                <img src={alert.petPhoto} alt={alert.petName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <PawPrint className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#059669] bg-[#D1FAE5] px-2 py-0.5 rounded">
                                  {alert.petName}
                                </span>
                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                  alert.type === 'vaccine' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {alert.type === 'vaccine' ? 'Vacina' : 'Consulta'}
                                </span>
                              </div>
                              <p className="text-sm font-bold text-[#1C1917] mt-0.5">{alert.title}</p>
                              <p className="text-xs text-[#1C1917]/60 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3.5 h-3.5 text-[#1C1917]/40" />
                                Vencimento: {new Date(alert.date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                              alert.daysRemaining <= 5
                                ? 'bg-red-500 text-white'
                                : 'bg-[#F97316] text-white'
                            }`}>
                              {alert.daysRemaining < 0 
                                ? 'Atrasado!' 
                                : alert.daysRemaining === 0 
                                  ? 'Hoje!' 
                                  : `Em ${alert.daysRemaining} dias`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Grid layout of summary charts & pets list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pet Selector Cards */}
                  <div className="bg-white border border-[#E4E4E0] rounded-3xl p-6 space-y-4">
                    <h3 className="text-base font-bold text-[#1C1917] uppercase tracking-wider">Seus Pets Cadastrados</h3>
                    
                    {pets.length === 0 ? (
                      <div className="py-8 text-center bg-[#FAFAF8] rounded-2xl p-4 border border-dashed border-[#E4E4E0]">
                        <p className="text-sm font-semibold">Nenhum pet cadastrado.</p>
                        <button
                          onClick={() => setIsAddingPet(true)}
                          className="text-[#059669] text-xs font-bold underline mt-1 inline-block"
                        >
                          Adicionar o primeiro pet agora
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                        {pets.map(p => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedPetId(p.id);
                              setActiveTab('pets');
                            }}
                            className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                              selectedPetId === p.id 
                                ? 'bg-[#D1FAE5]/30 border-[#059669]' 
                                : 'bg-[#FAFAF8] border-[#E4E4E0] hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#D1FAE5] overflow-hidden flex items-center justify-center text-[#059669] flex-shrink-0">
                                {p.photo_url ? (
                                  <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <PawPrint className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#1C1917]">{p.name}</p>
                                <p className="text-xs text-[#1C1917]/50">{p.type} • {p.breed}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#1C1917]/30" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Healthy Tip Column */}
                  <div className="bg-white border border-[#E4E4E0] rounded-3xl p-6 space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-[#F97316] font-bold text-xs uppercase tracking-wider mb-2">
                        <Sparkles className="w-4 h-4 fill-current" />
                        <span>Dica de Bem-estar</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#1C1917]">Hidratação Contínua na Dieta</h4>
                      <p className="text-xs text-[#1C1917]/70 leading-relaxed mt-1.5">
                        Gatos precisam de alto índice hidratação pois raramente bebem água paradas em potes normais. Oferecer ração úmida, patês ou usar fontes d'água fluídas melhora drasticamente a circulação renal de felinos prevenindo infecções urinárias.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('recipes')}
                      className="w-full bg-[#D1FAE5] text-[#059669] hover:bg-[#059669] hover:text-white font-bold py-2 px-3 rounded-xl text-xs uppercase tracking-wider transition-all mt-4"
                    >
                      criar receita
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column (4 cols) – Active Pet Quick Actions and general profile summary */}
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-white border border-[#E4E4E0] rounded-3xl p-6 space-y-6">
                  <div className="border-b border-[#E4E4E0] pb-4 flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-[#1C1917] uppercase tracking-wider">Pet em Destaque</h3>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  </div>

                  {activePet ? (
                    <div className="space-y-6">
                      {/* Avatar focus */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#D1FAE5] border-2 border-white shadow-md overflow-hidden flex items-center justify-center text-[#059669] flex-shrink-0">
                          {activePet.photo_url ? (
                            <img src={activePet.photo_url} alt={activePet.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <PawPrint className="w-7 h-7" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-[#1C1917] tracking-tight">{activePet.name}</h4>
                          <span className="inline-block text-[11px] font-bold text-[#059669] bg-[#D1FAE5] px-2 py-0.5 rounded mt-0.5">
                            {activePet.type}
                          </span>
                          <p className="text-xs text-[#1C1917]/50 mt-1">{activePet.breed}</p>
                        </div>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-3 bg-[#FAFAF8] p-3.5 rounded-2xl border border-[#E4E4E0]">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-[#1C1917]/50">Idade Calculada</p>
                          <p className="text-xs font-bold text-[#1C1917]">{getPetAgeText(activePet.birth_date)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-[#1C1917]/50">Nascimento</p>
                          <p className="text-xs font-bold text-[#1C1917]">
                            {new Date(activePet.birth_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      {/* Weight micro view */}
                      {renderWeightChart()}

                      {/* Quick Details buttons */}
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            setActiveTab('pets');
                          }}
                          className="w-full bg-[#FAFAF8] hover:bg-white border border-[#E4E4E0] hover:border-[#059669] text-[#1C1917] font-semibold py-2.5 rounded-xl text-xs uppercase tracking-wide transition-all text-center block"
                        >
                          Ver Histórico Médico Detalhado
                        </button>
                        <button
                          onClick={() => handleDeletePetClick(activePet.id)}
                          className="w-full text-red-500 hover:text-red-700 font-bold py-2 text-xs uppercase tracking-wide text-center"
                        >
                          Remover Pet
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-sm font-semibold text-[#1C1917]/50">Selecione ou adicione um pet acima.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: MY PETS DETAIL SHEETS */}
          {activeTab === 'pets' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Profile selector rails (3 cols) */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white border border-[#E4E4E0] rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#1C1917]/60 uppercase tracking-widest">Nossos Pets</span>
                    <button
                      id="pets-add-pet-btn"
                      onClick={() => setIsAddingPet(true)}
                      className="p-1 px-2.5 rounded-xl bg-[#D1FAE5] text-[#059669] hover:bg-[#059669] hover:text-white transition-all text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Incluir
                    </button>
                  </div>

                  {pets.length === 0 ? (
                    <p className="text-xs text-[#1C1917]/60 text-center py-4">Nenhum animal cadastrado ainda.</p>
                  ) : (
                    <div className="space-y-2">
                      {pets.map(p => (
                        <button
                          id={`pet-rail-select-${p.id}`}
                          key={p.id}
                          onClick={() => setSelectedPetId(p.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                            selectedPetId === p.id
                              ? 'bg-[#D1FAE5]/40 border-[#059669] text-[#059669]'
                              : 'bg-transparent border-[#E4E4E0] text-[#1C1917] hover:bg-[#FAFAF8]'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 overflow-hidden flex items-center justify-center text-[#059669] flex-shrink-0">
                            {p.photo_url ? (
                              <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <PawPrint className="w-4 h-4" />
                            )}
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-sm truncate">{p.name}</p>
                            <p className="text-[11px] text-[#1C1917]/50 truncate">{p.type} • {p.breed}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Active Pet medical history (9 cols) */}
              <div className="lg:col-span-9 space-y-8">
                {activePet ? (
                  <>
                    {/* Header Detail Overview Card */}
                    <div className="bg-white border border-[#E4E4E0] rounded-3xl p-6 md:p-8 space-y-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 rounded-3xl bg-[#D1FAE5] shadow-inner overflow-hidden flex items-center justify-center text-[#059669] border border-[#D1FAE5] flex-shrink-0">
                            {activePet.photo_url ? (
                              <img src={activePet.photo_url} alt={activePet.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <PawPrint className="w-9 h-9" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-2.5xl font-extrabold text-[#1C1917] tracking-tight">{activePet.name}</h3>
                              <span className="text-xs font-bold text-[#059669] bg-[#D1FAE5] px-2.5 py-1 rounded-full uppercase">
                                {activePet.type}
                              </span>
                            </div>
                            <p className="text-sm text-[#1C1917]/60 font-semibold mt-1">
                              {activePet.breed} • {getPetAgeText(activePet.birth_date)} de idade
                            </p>
                          </div>
                        </div>

                        {/* Action Triggers in profile */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            id="profile-add-vac-btn"
                            onClick={() => setIsAddingVaccine(true)}
                            className="bg-[#059669] text-[#D1FAE5] hover:bg-[#047857] px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Vacina
                          </button>
                          <button
                            id="profile-add-app-btn"
                            onClick={() => setIsAddingAppointment(true)}
                            className="bg-white border border-[#E4E4E0] text-[#1C1917] hover:border-[#059669] px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                          >
                            <Calendar className="w-3.5 h-3.5 text-[#059669]" /> Consulta
                          </button>
                          <button
                            id="profile-add-med-btn"
                            onClick={() => setIsAddingMed(true)}
                            className="bg-white border border-[#E4E4E0] text-[#1C1917] hover:border-[#059669] px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                          >
                            <Activity className="w-3.5 h-3.5 text-[#F97316]" /> Medicamento
                          </button>
                        </div>
                      </div>

                      {/* Weight plot evolution graphic */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                        <div className="md:col-span-8">
                          {renderWeightChart()}
                        </div>
                        <div className="md:col-span-4 bg-[#FAFAF8] p-5 rounded-2xl border border-[#E4E4E0] space-y-4 flex flex-col justify-between h-full">
                          <div>
                            <h4 className="text-xs font-extrabold text-[#1C1917]/60 uppercase tracking-widest">Registros de Peso</h4>
                            <p className="text-xs text-[#1C1917]/70 mt-1">Gerencie a evolução médica pesando o animal e adicionando novos marcos.</p>
                          </div>
                          
                          {/* Weight records subset listing list */}
                          <div className="max-h-[100px] overflow-y-auto space-y-1 my-3 pr-1">
                            {weights
                              .filter(w => w.pet_id === selectedPetId)
                              .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map(w => (
                                <div key={w.id} className="flex items-center justify-between bg-white text-xs p-1.5 px-2 rounded-xl border border-[#E4E4E0]">
                                  <span className="font-semibold">{w.weight} kg</span>
                                  <span className="text-[#1C1917]/55">{new Date(w.date).toLocaleDateString('pt-BR')}</span>
                                  <button onClick={() => handleDeleteWeightClick(w.id)} className="text-red-500 hover:text-red-700">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                          </div>

                          <button
                            id="profile-add-weight-btn"
                            onClick={() => setIsAddingWeight(true)}
                            className="w-full bg-[#FAFAF8] text-[#059669] hover:bg-[#059669] hover:text-white border-2 border-[#059669]/20 hover:border-[#059669] font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition-all"
                          >
                            Nova Pesagem
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* VACCINES CORNER */}
                    <div className="bg-white border border-[#E4E4E0] rounded-3xl p-6 md:p-8 space-y-4">
                      <div className="flex justify-between items-center border-b border-[#E4E4E0] pb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-[#059669]" />
                          <h4 className="text-lg font-extrabold text-[#1C1917]">Carteira de Vacinação</h4>
                        </div>
                        <span className="text-xs text-[#1C1917]/50 font-semibold">
                          {vaccines.filter(v => v.pet_id === selectedPetId).length} cadastrada(s)
                        </span>
                      </div>

                      {vaccines.filter(v => v.pet_id === selectedPetId).length === 0 ? (
                        <div className="text-center py-8 text-[#1C1917]/60 bg-[#FAFAF8] rounded-2xl">
                          <p className="text-sm font-semibold">Nenhuma vacina cadastrada para seu pet.</p>
                          <p className="text-xs mt-1">Registre todas as vacinas essenciais como V10, Antirrábica e Gripe.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {vaccines.filter(v => v.pet_id === selectedPetId).map(vac => {
                            const today = new Date();
                            const nd = new Date(vac.next_dose_date);
                            const diff = Math.ceil((nd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            const isNearRenewal = diff >= -7 && diff <= 30;

                            return (
                              <div 
                                key={vac.id} 
                                className={`p-4 rounded-2xl border flex items-start justify-between bg-[#FAFAF8] transition-all ${
                                  isNearRenewal ? 'border-[#F97316] bg-orange-50/20' : 'border-[#E4E4E0]'
                                }`}
                              >
                                <div className="space-y-1">
                                  <p className="font-bold text-sm text-[#1C1917]">{vac.name}</p>
                                  <p className="text-xs text-[#1C1917]/60">Aplicada em: {new Date(vac.date).toLocaleDateString('pt-BR')}</p>
                                  <p className="text-xs font-semibold text-[#1C1917]/85 flex items-center gap-1 mt-1">
                                    <Clock className="w-3.5 h-3.5 text-[#059669]" />
                                    Próxima Dose: {new Date(vac.next_dose_date).toLocaleDateString('pt-BR')}
                                  </p>
                                  {isNearRenewal && (
                                    <span className="inline-block text-[10px] uppercase font-bold text-[#F97316] bg-orange-100 rounded px-1.5 py-0.5 mt-2 animate-pulse">
                                      {diff < 0 ? 'Expirada!' : `Próxima em ${diff} dias!`}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDeleteVaccineClick(vac.id)}
                                  className="text-red-400 hover:text-red-600 transition-colors p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* VET APPOINTMENTS */}
                    <div className="bg-white border border-[#E4E4E0] rounded-3xl p-6 md:p-8 space-y-4">
                      <div className="flex justify-between items-center border-b border-[#E4E4E0] pb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-[#059669]" />
                          <h4 className="text-lg font-extrabold text-[#1C1917]">Consultas Médicas / Clínicas</h4>
                        </div>
                        <span className="text-xs text-[#1C1917]/50 font-semibold">
                          {appointments.filter(a => a.pet_id === selectedPetId).length} consulta(s)
                        </span>
                      </div>

                      {appointments.filter(a => a.pet_id === selectedPetId).length === 0 ? (
                        <div className="text-center py-8 text-[#1C1917]/60 bg-[#FAFAF8] rounded-2xl">
                          <p className="text-sm font-semibold">Nenhuma consulta agendada ou passada registrada.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {appointments.filter(a => a.pet_id === selectedPetId).map(app => (
                            <div key={app.id} className="p-4 bg-[#FAFAF8] rounded-2xl border border-[#E4E4E0] space-y-2 relative">
                              <button
                                onClick={() => handleDeleteAppClick(app.id)}
                                className="absolute right-4 top-4 text-red-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] uppercase font-extrabold text-[#059669] bg-[#D1FAE5] px-2 py-0.5 rounded">
                                  {new Date(app.date).toLocaleDateString('pt-BR')} {app.time && `@ ${app.time}`}
                                </span>
                                <span className="text-xs font-bold text-[#1C1917]/70">
                                  Vet: {app.veterinarian}
                                </span>
                              </div>

                              <div>
                                <h5 className="font-bold text-sm text-[#1C1917]">{app.reason}</h5>
                                {app.observations && (
                                  <div className="bg-white p-3 rounded-xl border border-[#E4E4E0] mt-1.5 text-xs text-[#1C1917]/75">
                                    <p className="font-semibold text-xs text-[#1C1917]/50">Observações Veterinárias:</p>
                                    <p className="mt-1 leading-relaxed">{app.observations}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* MEDICATIONS SCHEDULER */}
                    <div className="bg-white border border-[#E4E4E0] rounded-3xl p-6 md:p-8 space-y-4">
                      <div className="flex justify-between items-center border-b border-[#E4E4E0] pb-3">
                        <div className="flex items-center gap-2">
                          <Activity className="w-5 h-5 text-[#F97316]" />
                          <h4 className="text-lg font-extrabold text-[#1C1917]">Medicamentos / Tratamentos Ativos</h4>
                        </div>
                        <span className="text-xs text-[#1C1917]/50 font-semibold">
                          {medications.filter(m => m.pet_id === selectedPetId).length} tratamento(s)
                        </span>
                      </div>

                      {medications.filter(m => m.pet_id === selectedPetId).length === 0 ? (
                        <div className="text-center py-8 text-[#1C1917]/60 bg-[#FAFAF8] rounded-2xl">
                          <p className="text-sm font-semibold">Nenhum tratamento ou medicamento cadastrado.</p>
                          <p className="text-xs mt-1">Ótimo para registrar dosagens de antipulgas, vermífugos e antibióticos.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {medications.filter(m => m.pet_id === selectedPetId).map(med => (
                            <div key={med.id} className="p-4 bg-[#FAFAF8] rounded-2xl border border-[#E4E4E0] relative flex justify-between items-start gap-3">
                              <div className="space-y-1.5 text-xs">
                                <h5 className="font-bold text-sm text-[#1C1917]">{med.name}</h5>
                                <div className="space-y-0.5 mt-1 text-[#1C1917]/70">
                                  <p><span className="font-semibold text-[#1C1917]/50">Dose:</span> {med.dose}</p>
                                  <p><span className="font-semibold text-[#1C1917]/50">Frequência:</span> {med.frequency}</p>
                                  <p><span className="font-semibold text-[#1C1917]/50">Período:</span> {new Date(med.start_date).toLocaleDateString('pt-BR')} a {new Date(med.end_date).toLocaleDateString('pt-BR')}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteMedClick(med.id)}
                                className="text-red-400 hover:text-red-600 transition-colors p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20 bg-white border border-[#E4E4E0] rounded-3xl p-8">
                    <PawPrint className="w-12 h-12 text-[#059669]/60 mx-auto mb-4" />
                    <h3 className="text-xl font-bold">Inicie sua Família Petzy</h3>
                    <p className="text-[#1C1917]/60 text-sm mt-1 max-w-md mx-auto">
                      Cadastre seu pet cachorro, gato, pássaro, coelho ou até mesmo uma capivara de estimação para iniciar o monitoramento de saúde.
                    </p>
                    <button
                      onClick={() => setIsAddingPet(true)}
                      className="mt-6 bg-[#059669] text-white font-bold px-6 py-3 rounded-2xl text-xs uppercase tracking-wider transition-all"
                    >
                      Cadastrar Primeiro Pet
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: HEALTHY RECIPES & DATABASE SEED SYSTEM */}
          {activeTab === 'recipes' && (
            <div className="space-y-8 max-w-6xl mx-auto">
              
              {/* Optional: Seed Invitation Banner */}
              {!isSeeded && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <span className="inline-block bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                      Banco Vazio Detectado
                    </span>
                    <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">Deseja pré-popular com 180 receitas clínicas?</h3>
                    <p className="text-xs text-white/90 max-w-lg">
                      O banco de dados de receitas do Petzy de início está vazio. Adicione 30 receitas exclusivas, nutritivas e seguras para cada um dos 6 grupos de animais.
                    </p>
                  </div>
                  <button
                    id="seed-database-action"
                    onClick={handleExecuteSeed}
                    disabled={seedingLoading}
                    className="bg-white hover:bg-gray-100 disabled:opacity-50 text-[#059669] font-black p-4 px-6 rounded-2xl text-xs uppercase tracking-widest shadow-md transition-all active:scale-95 flex-shrink-0"
                  >
                    {seedingLoading ? 'Semeando Receitas...' : 'Executar Seed'}
                  </button>
                </div>
              )}

              {/* Filtering Controls and Header card */}
              <div className="bg-white border border-[#E4E4E0] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E4E0] pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#D1FAE5] text-[#059669] flex items-center justify-center">
                      <Sparkles className="w-6 h-6 fill-current animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-extrabold text-[#1C1917] tracking-tight">Receitas</h3>
                      <p className="text-xs text-[#1C1917]/60 mt-0.5">
                        Alimentação complementar saudável elaborada e enriquecida cientificamente.
                      </p>
                    </div>
                  </div>

                  {/* Create AI Recipe Button */}
                  <button
                    id="recipe-generate-action"
                    onClick={generateRecipe}
                    disabled={recipeLoading}
                    className="bg-[#F97316] hover:bg-[#EA580C] disabled:bg-opacity-50 text-white font-black p-3.5 px-6 rounded-2xl text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
                  >
                    {recipeLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Criando receita...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-current text-white/90" />
                        <span>criar receita</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Horizontal Animal Selector Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-[10px] font-bold text-[#1C1917]/50 uppercase tracking-widest block">Filtrar por Espécie</label>
                    <span className="text-xs font-bold text-[#059669] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                      {recipesList.length} {recipesList.length === 1 ? 'receita' : 'receitas'} para {selectedAnimalFilter}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {['Cachorro', 'Gato', 'Pássaro', 'Coelho', 'Hamster', 'Peixe'].map((species) => {
                      const isSelected = selectedAnimalFilter === species;
                      return (
                        <button
                          key={species}
                          onClick={() => {
                            setSelectedAnimalFilter(species);
                            // Clear temp loading states
                            setAiRecipe(null);
                            setRecipeError(null);
                          }}
                          className={`px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-200 active:scale-95 gap-1.5 flex items-center shadow-sm ${
                            isSelected 
                              ? 'bg-[#059669] text-white ring-2 ring-[#059669] ring-offset-2' 
                              : 'bg-[#FAFAF8] border border-[#E4E4E0] text-[#1C1917]/70 hover:bg-[#FAFAF8] hover:text-[#1C1917]'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#059669]'}`}></span>
                          <span>{species}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {recipeError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl">
                    <p className="font-bold">Ocorreu um erro:</p>
                    <p className="mt-0.5">{recipeError}</p>
                  </div>
                )}
              </div>

              {/* Recipe Cards List view */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipesList.length > 0 ? (
                  recipesList.map((recipe) => (
                    <div 
                      key={recipe.id}
                      className="bg-white border border-[#E4E4E0] rounded-3xl p-6 flex flex-col justify-between space-y-5 transition-all hover:border-[#059669] hover:shadow-md hover:-translate-y-0.5 duration-200"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-[10px] font-bold bg-[#FAFAF8] text-[#1C1917]/60 border border-[#E4E4E0] px-2 py-0.5 rounded uppercase tracking-wide">
                            {recipe.tipoAnimal}
                          </span>
                          {recipe.geradaPorIA && (
                            <span className="text-[9px] font-extrabold bg-orange-50 text-[#F97316] border border-orange-100 px-1.5 py-0.5 rounded flex items-center gap-1 uppercase tracking-wide">
                              <Sparkles className="w-2.5 h-2.5 fill-current" />
                              <span>IA</span>
                            </span>
                          )}
                        </div>

                        <h4 className="font-extrabold text-[#1C1917] text-lg leading-snug tracking-tight">
                          {recipe.titulo}
                        </h4>

                        <p className="text-xs text-[#1C1917]/70 leading-relaxed line-clamp-3">
                          {recipe.descricao}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#FAFAF8] flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400">
                          {recipe.ingredientes.length} ingredientes
                        </span>
                        
                        <button
                          onClick={() => setSelectedDbRecipe(recipe)}
                          className="bg-[#059669] hover:bg-[#047857] text-white font-black p-2.5 px-4 rounded-xl text-[10px] uppercase tracking-wider transition-colors"
                        >
                          Ver Receita
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white border border-[#E4E4E0] rounded-3xl p-10 text-center col-span-full space-y-4">
                    <div className="w-16 h-16 rounded-full bg-orange-50 text-[#F97316] flex items-center justify-center mx-auto">
                      <Sparkles className="w-8 h-8 fill-current" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-base text-[#1C1917]">Nenhuma receita encontrada para {selectedAnimalFilter}</h4>
                      <p className="text-xs text-[#1C1917]/65 max-w-md mx-auto">
                        Se este for seu primeiro acesso, clique em <strong className="text-[#059669]">Executar Seed</strong> no banner acima para popular o banco, ou clique em <strong className="text-orange-600">criar receita</strong> para formular uma inédita usando o Gemini!
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </>
      )}

      {/* -------------------------------------------------------------
          MODALS & RECORD DIALOG FORMS
         ------------------------------------------------------------- */}

      {/* MODAL 1: ADD PET */}
      {isAddingPet && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E4E4E0] w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-extrabold text-lg text-[#1C1917]">Cadastrar Novo Pet</h3>
              <button 
                onClick={() => setIsAddingPet(false)} 
                className="text-gray-400 hover:text-gray-600 text-sm font-bold bg-gray-50 p-1.5 px-3 rounded-lg"
              >
                X
              </button>
            </div>

            <form onSubmit={handleAddPetSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1C1917]/60">Nome do Pet*</label>
                <input
                  id="pet-form-name"
                  type="text"
                  required
                  placeholder="Ex: Toddy, Pandora"
                  value={newPetName}
                  onChange={(e) => setNewPetName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E4E4E0] focus:ring-2 focus:ring-[#059669] focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1C1917]/60">Espécie*</label>
                  <select
                    id="pet-form-type"
                    value={newPetType}
                    onChange={(e) => setNewPetType(e.target.value)}
                    className="w-full bg-white px-3 py-2.5 rounded-xl border border-[#E4E4E0] focus:ring-2 focus:ring-[#059669] text-sm"
                  >
                    <option value="Cachorro">Cachorro</option>
                    <option value="Gato">Gato</option>
                    <option value="Capivara">Capivara</option>
                    <option value="Ave">Ave / Pássaro</option>
                    <option value="Roedor">Roedor</option>
                    <option value="Réptil">Réptil</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1C1917]/60">Raça</label>
                  <input
                    id="pet-form-breed"
                    type="text"
                    placeholder="Ex: Persa, Lhasa Apso"
                    value={newPetBreed}
                    onChange={(e) => setNewPetBreed(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E4E4E0] focus:ring-2 focus:ring-[#059669] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1C1917]/60">Nascimento</label>
                  <input
                    id="pet-form-birth"
                    type="date"
                    value={newPetBirth}
                    onChange={(e) => setNewPetBirth(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E4E4E0] focus:ring-2 focus:ring-[#059669] text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#1C1917]/60">Foto URL (Opcional)</label>
                  <input
                    id="pet-form-photo"
                    type="url"
                    placeholder="Cole um link de foto de internet"
                    value={newPetPhoto}
                    onChange={(e) => setNewPetPhoto(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E4E4E0] focus:ring-2 focus:ring-[#059669] text-sm"
                  />
                </div>
              </div>

              <p className="text-[10px] text-gray-400 leading-relaxed italic">* A foto é opcional. Caso não forneça, o visualizador Petzy representará o animal com avatares de traços minimalistas correspondentes à categoria.</p>

              <button
                id="pet-form-submit-btn"
                type="submit"
                className="w-full bg-[#059669] hover:bg-[#047857] text-[#D1FAE5] font-bold py-3 rounded-2xl text-xs uppercase tracking-widest transition-all"
              >
                Salvar Cadastro do Pet
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD VACCINE */}
      {isAddingVaccine && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E4E4E0] w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-lg text-[#1C1917]">Registrar Vacina</h3>
              <button onClick={() => setIsAddingVaccine(false)} className="text-gray-400 hover:text-gray-600 text-sm font-bold bg-gray-50 p-1 px-2 rounded">X</button>
            </div>

            <form onSubmit={handleAddVaccineSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#1C1917]/60">Vincular ao Pet</label>
                <select
                  id="vac-form-pet"
                  value={newVacPet || selectedPetId}
                  onChange={(e) => setNewVacPet(e.target.value)}
                  className="w-full bg-white p-2.5 rounded-xl border text-sm text-[#1C1917]"
                >
                  {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#1C1917]/60">Nome da Vacina*</label>
                <input
                  id="vac-form-name"
                  type="text"
                  required
                  placeholder="Ex: Antirrábica, V10, Quíntupla"
                  value={newVacName}
                  onChange={(e) => setNewVacName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#1C1917]/60">Data da Dose*</label>
                  <input
                    id="vac-form-date"
                    type="date"
                    required
                    value={newVacDate}
                    onChange={(e) => setNewVacDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#1C1917]/60">Próxima Dose*</label>
                  <input
                    id="vac-form-next"
                    type="date"
                    required
                    value={newVacNext}
                    onChange={(e) => setNewVacNext(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border text-xs"
                  />
                </div>
              </div>

              <button
                id="vac-form-submit-btn"
                type="submit"
                className="w-full bg-[#F97316] text-white font-bold py-3 rounded-2xl text-xs uppercase tracking-wider"
              >
                Concluir Registro
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD APPOINTMENT */}
      {isAddingAppointment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E4E4E0] w-full max-w-lg p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-lg text-[#1C1917]">Adicionar Consulta Veterinária</h3>
              <button onClick={() => setIsAddingAppointment(false)} className="text-gray-400 hover:text-gray-600 text-sm font-bold bg-gray-50 p-1 px-2 rounded">X</button>
            </div>

            <form onSubmit={handleAddAppointmentSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#1C1917]/60">Pet</label>
                <select
                  id="app-form-pet"
                  value={newAppPet || selectedPetId}
                  onChange={(e) => setNewAppPet(e.target.value)}
                  className="w-full bg-white p-2.5 rounded-xl border text-sm text-[#1C1917]"
                >
                  {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#1C1917]/60">Data*</label>
                  <input
                    id="app-form-date"
                    type="date"
                    required
                    value={newAppDate}
                    onChange={(e) => setNewAppDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#1C1917]/60">Horário</label>
                  <input
                    id="app-form-time"
                    type="time"
                    value={newAppTime}
                    onChange={(e) => setNewAppTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#1C1917]/60">Veterinário(a)*</label>
                <input
                  id="app-form-vet"
                  type="text"
                  required
                  placeholder="Nome do Médico Veterinário"
                  value={newAppVet}
                  onChange={(e) => setNewAppVet(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#1C1917]/60">Motivo da Consulta*</label>
                <input
                  id="app-form-reason"
                  type="text"
                  required
                  placeholder="Ex: Vacinação, Perda de apetite, Exame de rotina"
                  value={newAppReason}
                  onChange={(e) => setNewAppReason(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#1C1917]/60">Observações adicionais</label>
                <textarea
                  id="app-form-obs"
                  placeholder="Sintomas, medicações prescritas, orientações alimentares"
                  rows={3}
                  value={newAppObs}
                  onChange={(e) => setNewAppObs(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border text-sm"
                />
              </div>

              <button
                id="app-form-submit-btn"
                type="submit"
                className="w-full bg-[#059669] text-[#D1FAE5] font-bold py-3 rounded-2xl text-xs uppercase tracking-wider"
              >
                Concluir Agenda
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD MEDICATION */}
      {isAddingMed && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E4E4E0] w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-lg text-[#1C1917]">Prescrever Tratamento</h3>
              <button onClick={() => setIsAddingMed(false)} className="text-gray-400 hover:text-gray-600 text-sm font-bold bg-gray-50 p-1 px-2 rounded">X</button>
            </div>

            <form onSubmit={handleAddMedicationSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#1C1917]/60">Destinar ao Pet</label>
                <select
                  id="med-form-pet"
                  value={newMedPet || selectedPetId}
                  onChange={(e) => setNewMedPet(e.target.value)}
                  className="w-full bg-white p-2.5 rounded-xl border text-sm text-[#1C1917]"
                >
                  {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#1C1917]/60">Nome do Medicamento*</label>
                <input
                  id="med-form-name"
                  type="text"
                  required
                  placeholder="Ex: Cefalexina 150mg"
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#1C1917]/60">Dose Prescrita*</label>
                  <input
                    id="med-form-dosage"
                    type="text"
                    required
                    placeholder="Ex: 5 ml, 1 comprimido"
                    value={newMedDose}
                    onChange={(e) => setNewMedDose(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#1C1917]/60">Frequência*</label>
                  <input
                    id="med-form-freq"
                    type="text"
                    required
                    placeholder="Ex: 12h-12h, diária"
                    value={newMedFreq}
                    onChange={(e) => setNewMedFreq(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#1C1917]/60">Data de Início*</label>
                  <input
                    id="med-form-start"
                    type="date"
                    required
                    value={newMedStart}
                    onChange={(e) => setNewMedStart(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#1C1917]/60">Data de Fim*</label>
                  <input
                    id="med-form-end"
                    type="date"
                    required
                    value={newMedEnd}
                    onChange={(e) => setNewMedEnd(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border text-xs"
                  />
                </div>
              </div>

              <button
                id="med-form-submit-btn"
                type="submit"
                className="w-full bg-[#F97316] text-white font-bold py-3 rounded-2xl text-xs uppercase tracking-wider"
              >
                Ativar Tratamento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD WEIGHT */}
      {isAddingWeight && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E4E4E0] w-full max-w-sm p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-lg text-[#1C1917]">Registrar Peso</h3>
              <button onClick={() => setIsAddingWeight(false)} className="text-gray-400 hover:text-gray-600 text-sm font-bold bg-gray-50 p-1 px-2 rounded">X</button>
            </div>

            <form onSubmit={handleAddWeightSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#1C1917]/60 font-sans">Vincular Peso a qual Pet</label>
                <select
                  id="weight-form-pet"
                  value={newWeightPet || selectedPetId}
                  onChange={(e) => setNewWeightPet(e.target.value)}
                  className="w-full bg-white p-2.5 rounded-xl border text-sm text-[#1C1917]"
                >
                  {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#1C1917]/60">Peso em Quilogramas (kg)*</label>
                <input
                  id="weight-form-val"
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  placeholder="Ex: 12.5"
                  value={newWeightValue}
                  onChange={(e) => setNewWeightValue(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#1C1917]/60 block">Data da Medição*</label>
                <input
                  id="weight-form-date"
                  type="date"
                  required
                  value={newWeightDate}
                  onChange={(e) => setNewWeightDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border text-xs"
                />
              </div>

              <button
                id="weight-form-submit-btn"
                type="submit"
                className="w-full bg-[#059669] text-[#D1FAE5] font-bold py-3 rounded-2xl text-xs uppercase tracking-wider"
              >
                Gravar Peso
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: VIEW RECIPE DETAILS */}
      {selectedDbRecipe && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E4E4E0] w-full max-w-2xl p-6 md:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[#E4E4E0] pb-4">
              <div>
                <span className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wide ${
                  selectedDbRecipe.geradaPorIA 
                    ? 'bg-orange-50 text-[#F97316] border border-orange-100' 
                    : 'bg-emerald-50 text-[#059669] border border-emerald-100'
                }`}>
                  {selectedDbRecipe.geradaPorIA ? 'Gerada por IA' : 'Receita Clássica'}
                </span>
                <h3 className="font-extrabold text-[#1C1917] text-xl md:text-2xl mt-1 leading-tight">{selectedDbRecipe.titulo}</h3>
                <p className="text-xs text-[#1C1917]/50 mt-0.5">Indicado para: <strong className="text-[#059669]">{selectedDbRecipe.tipoAnimal}</strong></p>
              </div>
              <button 
                onClick={() => setSelectedDbRecipe(null)} 
                className="text-gray-400 hover:text-gray-600 text-sm font-bold bg-gray-50 p-2 px-3 rounded-lg border border-[#E4E4E0]"
              >
                X
              </button>
            </div>

            <p className="text-xs font-semibold leading-relaxed text-[#1C1917]/75 bg-[#FAFAF8] p-4 rounded-xl border border-[#E4E4E0]/60 italic">
              "{selectedDbRecipe.descricao}"
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-widest text-[#1C1917]/60">Ingredientes</h4>
                <ul className="space-y-2">
                  {selectedDbRecipe.ingredientes.map((ing, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-[#1C1917]/85 leading-relaxed">
                      <span className="w-2 h-2 rounded-full bg-[#059669] mt-2 flex-shrink-0"></span>
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-widest text-[#1C1917]/60">Modo de Preparo</h4>
                <ol className="space-y-3">
                  {selectedDbRecipe.instructions && selectedDbRecipe.instructions.map((inst, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      <span className="w-5 h-5 rounded-full bg-[#D1FAE5] text-[#059669] font-bold flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-[#1C1917]/80 leading-relaxed font-semibold">{inst}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-xs space-y-1">
              <p className="font-bold text-[#059669] uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Benefícios de Saúde
              </p>
              <p className="text-[#1C1917]/85 font-semibold leading-relaxed">
                {selectedDbRecipe.beneficios}
              </p>
              <p className="text-[10px] text-[#1C1917]/40 leading-relaxed pt-2 border-t border-[#E4E4E0] mt-2 italic">
                * Nota: As receitas do Petzy funcionam na modalidade complementar para nutrir com carinho e reforçar a imunidade. Sempre consulte o seu veterinário assistente clínico para mudanças drásticas na dieta habitual do seu animal.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
