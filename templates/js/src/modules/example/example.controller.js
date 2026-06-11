import * as exampleService from './example.service.js';

// Plain async functions.
// The route loader automatically wraps all async handlers — no manual wrapping needed.

export const list = async (req, res) => {
  const response = await exampleService.listExamples(req.query);
  res.status(200).json(response);
};

export const getOne = async (req, res) => {
  const response = await exampleService.getExampleById(req.params.id);
  res.status(200).json(response);
};

export const create = async (req, res) => {
  const response = await exampleService.createExample(req.body);
  res.status(201).json(response);
};

export const update = async (req, res) => {
  const response = await exampleService.updateExample(req.params.id, req.body);
  res.status(200).json(response);
};

export const remove = async (req, res) => {
  const response = await exampleService.deleteExample(req.params.id);
  res.status(200).json(response);
};
