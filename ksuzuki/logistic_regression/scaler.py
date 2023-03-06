import numpy as np


class MinMaxScaler:
    def __init__(self):
        self.min_value = None
        self.min_value = None

    def fit(self, x):
        self.min_value = x.min(axis=0)
        self.max_value = x.max(axis=0)

    def predict(self, x):
        eps = 1e-7
        return (x - self.min_value) / np.clip(self.max_value - self.min_value, eps, None)
