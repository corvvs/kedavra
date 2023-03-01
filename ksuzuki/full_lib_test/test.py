#%%
print('hello')
# %%
import pandas as pd
# %%
df = pd.read_csv('../../../datasets/dataset_train.csv', index_col=0)
# %%
df
# %%
df.describe()
# %%
import matplotlib.pyplot as plt
# %%
df.columns
# %%
data_col = ['Hogwarts House', 'Arithmancy', 'Astronomy', 'Herbology', 'Defense Against the Dark Arts',
       'Divination', 'Muggle Studies', 'Ancient Runes', 'History of Magic',
       'Transfiguration', 'Potions', 'Care of Magical Creatures', 'Charms',
       'Flying']
temp_df = df[data_col]
temp_df
# %%
import seaborn as sns
# %%
sns.pairplot(df, hue='Hogwarts House')
