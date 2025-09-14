import { supabase } from '../config/supabase';
import { Flow, Step, FlowInsert, StepInsert } from '../types/database';
import { ParsedFlow, ParsedStep, geminiService } from './gemini';

export class DatabaseService {
  // Create a new flow with steps from AI breakdown
  async createFlowFromTask(userTask: string, onProgress?: (message: string) => void): Promise<Flow> {
    try {
      onProgress?.('Breaking down your task...');

      // Get AI breakdown
      const parsedFlow = await geminiService.breakdownTask(userTask);

      onProgress?.('Creating your flow...');

      // Create flow record
      const { data: flow, error: flowError } = await supabase
        .from('flows')
        .insert({
          title: parsedFlow.title,
          // user_id will be automatically set by RLS since user is authenticated
        })
        .select()
        .single();

      if (flowError || !flow) {
        throw new Error(flowError?.message || 'Failed to create flow');
      }

      onProgress?.('Adding steps...');

      // Create step records
      const stepsToInsert: StepInsert[] = parsedFlow.steps.map((step) => ({
        flow_id: flow.id,
        step_number: step.stepNumber,
        title: step.title,
        time_estimate: step.timeEstimate,
        description: step.description,
        completion_cue: step.completionCue,
        is_completed: false,
      }));

      const { error: stepsError } = await supabase
        .from('steps')
        .insert(stepsToInsert);

      if (stepsError) {
        // Clean up the flow if steps creation failed
        await supabase.from('flows').delete().eq('id', flow.id);
        throw new Error(stepsError.message || 'Failed to create steps');
      }

      onProgress?.('Flow created successfully!');

      return flow;
    } catch (error) {
      console.error('Error creating flow from task:', error);
      throw error;
    }
  }

  // Get all flows for the current user
  async getFlows(): Promise<Flow[]> {
    const { data, error } = await supabase
      .from('flows')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  // Get a specific flow with its steps
  async getFlowWithSteps(flowId: string): Promise<{
    flow: Flow;
    steps: Step[];
  }> {
    const [flowResult, stepsResult] = await Promise.all([
      supabase.from('flows').select('*').eq('id', flowId).single(),
      supabase.from('steps').select('*').eq('flow_id', flowId).order('step_number')
    ]);

    if (flowResult.error) {
      throw new Error(flowResult.error.message);
    }

    if (stepsResult.error) {
      throw new Error(stepsResult.error.message);
    }

    return {
      flow: flowResult.data,
      steps: stepsResult.data || []
    };
  }

  // Update step completion status
  async toggleStepCompletion(stepId: string, isCompleted: boolean): Promise<Step> {
    const { data, error } = await supabase
      .from('steps')
      .update({
        is_completed: isCompleted,
        updated_at: new Date().toISOString()
      })
      .eq('id', stepId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update step');
    }

    return data;
  }

  // Delete a flow and all its steps
  async deleteFlow(flowId: string): Promise<void> {
    const { error } = await supabase
      .from('flows')
      .delete()
      .eq('id', flowId);

    if (error) {
      throw new Error(error.message);
    }
  }

  // Update flow title
  async updateFlowTitle(flowId: string, title: string): Promise<Flow> {
    const { data, error } = await supabase
      .from('flows')
      .update({
        title,
        updated_at: new Date().toISOString()
      })
      .eq('id', flowId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to update flow');
    }

    return data;
  }

  // Get flow completion statistics
  async getFlowStats(flowId: string): Promise<{
    totalSteps: number;
    completedSteps: number;
    completionPercentage: number;
  }> {
    const { data: steps, error } = await supabase
      .from('steps')
      .select('is_completed')
      .eq('flow_id', flowId);

    if (error) {
      throw new Error(error.message);
    }

    const totalSteps = steps?.length || 0;
    const completedSteps = steps?.filter(step => step.is_completed).length || 0;
    const completionPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    return {
      totalSteps,
      completedSteps,
      completionPercentage
    };
  }

  // Split a step into two smaller steps
  async splitStep(stepId: string, onProgress?: (message: string) => void): Promise<Step[]> {
    try {
      onProgress?.('Getting step details...');

      // Get the step to split
      const { data: step, error: stepError } = await supabase
        .from('steps')
        .select('*')
        .eq('id', stepId)
        .single();

      if (stepError || !step) {
        throw new Error(stepError?.message || 'Step not found');
      }

      onProgress?.('Breaking down step...');

      // Use AI to split the step
      const splitSteps = await geminiService.splitStep(
        step.title,
        step.description,
        step.time_estimate
      );

      onProgress?.('Creating new steps...');

      // Get all steps for this flow to determine proper step numbering
      const { data: allSteps, error: allStepsError } = await supabase
        .from('steps')
        .select('step_number')
        .eq('flow_id', step.flow_id)
        .order('step_number');

      if (allStepsError) {
        throw new Error(allStepsError.message);
      }

      // Update step numbers for steps after the current one
      const currentStepNumber = step.step_number;
      const stepsToUpdate = allSteps?.filter(s => s.step_number > currentStepNumber) || [];

      for (let i = 0; i < stepsToUpdate.length; i++) {
        const stepToUpdate = stepsToUpdate[i];
        await supabase
          .from('steps')
          .update({ step_number: stepToUpdate.step_number + 1 })
          .eq('flow_id', step.flow_id)
          .eq('step_number', stepToUpdate.step_number);
      }

      // Replace the original step with the first split step
      const { data: firstStep, error: firstStepError } = await supabase
        .from('steps')
        .update({
          title: splitSteps[0].title,
          time_estimate: splitSteps[0].timeEstimate,
          description: splitSteps[0].description,
          completion_cue: splitSteps[0].completionCue,
          updated_at: new Date().toISOString()
        })
        .eq('id', stepId)
        .select()
        .single();

      if (firstStepError || !firstStep) {
        throw new Error(firstStepError?.message || 'Failed to update first step');
      }

      // Insert the second split step
      const { data: secondStep, error: secondStepError } = await supabase
        .from('steps')
        .insert({
          flow_id: step.flow_id,
          step_number: currentStepNumber + 1,
          title: splitSteps[1].title,
          time_estimate: splitSteps[1].timeEstimate,
          description: splitSteps[1].description,
          completion_cue: splitSteps[1].completionCue,
          is_completed: false
        })
        .select()
        .single();

      if (secondStepError || !secondStep) {
        throw new Error(secondStepError?.message || 'Failed to create second step');
      }

      onProgress?.('Split completed!');

      return [firstStep, secondStep];
    } catch (error) {
      console.error('Error splitting step:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();